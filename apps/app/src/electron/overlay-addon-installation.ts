import { app } from 'electron'
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import path from 'node:path'
import identity from '../../application-identity.json'

export const OVERLAY_APPLICATION_ID = identity.applicationId

type InstallationState = {
  schemaVersion: 1
  applicationId: string
  registrationId: string
  obsoleteRegistrationIds: string[]
}
type SetupStage = 'read-state' | 'register' | 'save-state' | 'remove-obsolete'

export class OverlayAddonSetupError extends Error {
  readonly code = 'overlay-addon-setup-failed'
  readonly filesystemCode?: string

  constructor(public readonly stage: SetupStage, cause: unknown) {
    super(`Installed overlay add-on setup failed during ${stage}`, { cause })
    const code = (cause as NodeJS.ErrnoException)?.code
    if (typeof code === 'string' && /^[A-Z0-9_]{1,40}$/.test(code))
      this.filesystemCode = code
  }
}

let pending: Promise<void> | undefined

// Called only for the enabled Windows experimental backend, under the account
// running Izabela. Never run this from afterPack or unregister on ordinary exit.
export function ensureOverlayAddonInstallation(): Promise<void> {
  if (!pending)
    pending = prepare().finally(() => {
      pending = undefined
    })
  return pending
}

async function prepare() {
  let stage: SetupStage = 'read-state'
  try {
    const directory = path.join(
      app.getPath('userData'),
      'experimental-game-overlay',
    )
    const filename = path.join(directory, 'addon-installation.json')
    let previous: InstallationState | undefined
    try {
      previous = JSON.parse(await readFile(filename, 'utf8'))
      if (
        !previous ||
        previous.schemaVersion !== 1 ||
        previous.applicationId !== OVERLAY_APPLICATION_ID ||
        typeof previous.registrationId !== 'string' ||
        !previous.registrationId ||
        !Array.isArray(previous.obsoleteRegistrationIds) ||
        previous.obsoleteRegistrationIds.some(
          (id) => typeof id !== 'string' || !id,
        )
      )
        throw new Error('Invalid installed add-on state')
    } catch (error) {
      if ((error as NodeJS.ErrnoException)?.code !== 'ENOENT') throw error
    }

    stage = 'register'
    const sdk: typeof import('electron-game-overlay/preload') = require('electron-game-overlay/preload')
    // The SDK resolves its physical package and shared per-user registry/cache.
    // userData below stores only Izabela's registration IDs, never SDK payloads.
    const installation = await sdk.registerOverlayAddonInstallation({
      applicationId: OVERLAY_APPLICATION_ID,
    })
    if (
      installation.applicationId !== OVERLAY_APPLICATION_ID ||
      !installation.registrationId
    )
      throw new Error('Unexpected installed add-on identity')
    const state: InstallationState = {
      schemaVersion: 1,
      applicationId: installation.applicationId,
      registrationId: installation.registrationId,
      obsoleteRegistrationIds: [
        ...new Set(
          previous
            ? [previous.registrationId, ...previous.obsoleteRegistrationIds]
            : [],
        ),
      ].filter((id) => id !== installation.registrationId),
    }
    const save = async () => {
      stage = 'save-state'
      await mkdir(directory, { recursive: true })
      const temporary = `${filename}.${randomUUID()}.tmp`
      try {
        await writeFile(temporary, JSON.stringify(state), {
          flag: 'wx',
          mode: 0o600,
        })
        await rename(temporary, filename)
      } finally {
        await rm(temporary, { force: true }).catch(() => {})
      }
    }
    // Persist the replacement and pending cleanup before removing any old build.
    await save()
    for (const registrationId of [...state.obsoleteRegistrationIds]) {
      stage = 'remove-obsolete'
      await sdk.unregisterOverlayAddonInstallation({
        applicationId: state.applicationId,
        registrationId,
      })
      state.obsoleteRegistrationIds = state.obsoleteRegistrationIds.filter(
        (id) => id !== registrationId,
      )
      await save()
    }
  } catch (error) {
    throw new OverlayAddonSetupError(stage, error)
  }
}
