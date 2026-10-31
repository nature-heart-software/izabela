import { app, dialog } from 'electron'
import path from 'node:path'
import { Buffer } from 'node:buffer'
import sudo from '@vscode/sudo-prompt'
import koffi from 'koffi'
import gameOverlay from '@/electron/game-overlay-backend'
import { dialogsMap } from '@/modules/electron-dialog'
import { defenderExclusionCommand, injectorExclusionPaths } from './plan'

export type OverlayDefenderResult = {
  status: 'added' | 'cancelled' | 'failed'
  message?: string
}

let pending: Promise<OverlayDefenderResult> | undefined

// This privileged action accepts no paths or commands from the renderer.
// The main-process native warning is mandatory even for direct IPC invocation.
export function addOverlayInjectorDefenderExclusions(): Promise<OverlayDefenderResult> {
  if (pending) return pending
  pending = configure().finally(() => {
    pending = undefined
  })
  return pending
}

async function configure(): Promise<OverlayDefenderResult> {
  if (process.platform !== 'win32' || process.arch !== 'x64')
    return {
      status: 'failed',
      message:
        'This action requires Windows x64 and Microsoft Defender Antivirus.',
    }
  try {
    const sdk: typeof import('electron-game-overlay') = require('electron-game-overlay')
    // Discovery works even if Defender has already quarantined an injector.
    // The SDK stages each launch in a direct child of these public run roots.
    const paths = injectorExclusionPaths(
      sdk.defaultReShadeRuntimeDirectory(),
      path.join(app.getPath('userData'), 'experimental-game-overlay', 'runs'),
      sdk.defaultReShadeRunsRootDirectory(),
    )
    gameOverlay.stopIntercept()
    const warning = dialog.showMessageBox({
      type: 'warning',
      title: 'Windows Defender exclusions',
      message: 'Exclude the overlay injector files from Windows Defender?',
      detail: [
        'This reduces antivirus protection. Defender will skip scanning files at the paths below, including future injector copies matching these rules. Shared SDK run folders may also contain injector copies from other applications. A replacement file at the same path is also excluded. Continue only if you trust the overlay SDK.',
        'These exclusions do not confirm that a detection is a false positive and may not prevent behavioral detections. Files already quarantined are not restored.',
        'Injector paths (* matches one launch folder):\n' + paths.join('\n'),
        "Administrator approval is required for this change. Izabela's administrator-startup setting will stay unchanged. You can remove these rules in Windows Security under Virus & threat protection → Manage settings → Exclusions.",
      ].join('\n\n'),
      buttons: ['Cancel', 'Add exclusions'],
      defaultId: 0,
      cancelId: 0,
      noLink: true,
    })
    dialogsMap.set('overlay-defender-exclusions', warning)
    let response: number
    try {
      response = (await warning).response
    } finally {
      dialogsMap.delete('overlay-defender-exclusions')
    }
    if (response !== 1) return { status: 'cancelled' }
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
            message:
              'Injector exclusions are configured. Restart Izabela and the game before testing again.',
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
