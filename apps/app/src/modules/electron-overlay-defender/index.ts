import { app } from 'electron'
import { randomUUID } from 'node:crypto'
import path from 'node:path'
import { Buffer } from 'node:buffer'
import sudo from '@vscode/sudo-prompt'
import koffi from 'koffi'
import gameOverlay from '@/electron/game-overlay-backend'
import { defenderExclusionCommand, injectorExclusionPaths } from './plan'

export type OverlayDefenderResult = {
  status: 'added' | 'cancelled' | 'failed'
  message?: string
}

export type OverlayDefenderPlan =
  | { status: 'ready'; token: string }
  | { status: 'failed'; message: string }

let prepared: { token: string; paths: string[] } | undefined
let pending: Promise<OverlayDefenderResult> | undefined
let pendingToken: string | undefined

// Paths and commands are owned by main; the renderer confirms that prepared
// plan with its opaque token from the in-app dialog.
export async function prepareOverlayInjectorDefenderExclusions(): Promise<OverlayDefenderPlan> {
  prepared = undefined
  if (process.platform !== 'win32' || process.arch !== 'x64')
    return {
      status: 'failed',
      message:
        'This action requires Windows x64 and Microsoft Defender Antivirus.',
    }
  try {
    const sdk: typeof import('electron-game-overlay') = require('electron-game-overlay')
    const paths = injectorExclusionPaths(
      sdk.defaultReShadeRuntimeDirectory(),
      path.join(app.getPath('userData'), 'experimental-game-overlay', 'runs'),
      sdk.defaultReShadeRunsRootDirectory(),
    )
    prepared = { token: randomUUID(), paths }
    return {
      status: 'ready',
      token: prepared.token,
    }
  } catch {
    return {
      status: 'failed',
      message: 'The overlay injector paths could not be determined.',
    }
  }
}

export function addOverlayInjectorDefenderExclusions(
  token: string,
): Promise<OverlayDefenderResult> {
  if (pending && token === pendingToken) return pending
  if (pending || !prepared || token !== prepared.token)
    return Promise.resolve({
      status: 'failed',
      message: 'Open the exclusions dialog and confirm before continuing.',
    })
  const { paths } = prepared
  prepared = undefined
  pendingToken = token
  pending = configure(paths).finally(() => {
    pending = undefined
    pendingToken = undefined
  })
  return pending
}

async function configure(
  paths: readonly string[],
): Promise<OverlayDefenderResult> {
  try {
    gameOverlay.stopIntercept()
    // Resolve the OS executable directory through the Windows API, rather than
    // trusting a user-controlled environment variable for an elevated program.
    const getSystemDirectory = koffi
      .load('kernel32.dll')
      .func('uint32 GetSystemDirectoryW(_Out_ uint16_t *buffer, uint32 size)')
    const buffer = Buffer.alloc(32768 * 2)
    const length = getSystemDirectory(buffer, 32768)
    if (!length || length >= 32768)
      throw new Error('Windows directory unavailable')
    const command = defenderExclusionCommand(
      paths,
      buffer.toString('utf16le', 0, length * 2),
    )
    return await new Promise<OverlayDefenderResult>((resolve) => {
      sudo.exec(command, { name: 'Izabela Next' }, (error, stdout) => {
        try {
          if (error) throw error
          const result = JSON.parse(String(stdout).trim())
          if (result.status !== 'added' || result.count !== paths.length)
            throw new Error('Unverified Defender result')
          resolve({
            status: 'added',
            message: 'Injector exclusions are configured.',
          })
        } catch {
          resolve({
            status: 'failed',
            message:
              'Exclusions could not be verified. Administrator approval may have been cancelled, or device policy may block changes. Check Windows Security before trying again.',
          })
        }
      })
    })
  } catch {
    return {
      status: 'failed',
      message:
        'Windows Defender exclusions could not be configured. Check that Microsoft Defender Antivirus is available and local changes are allowed.',
    }
  }
}
