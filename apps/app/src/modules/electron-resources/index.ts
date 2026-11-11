import si from 'systeminformation'
import sudo from '@vscode/sudo-prompt'
import filter from 'lodash/filter'
import path from 'path'
import { Buffer } from 'node:buffer'
import { execFile } from 'node:child_process'
import { EXTERNALS_DIR } from '@/electron/utils'
import { app } from 'electron'
import { Deferred } from '@packages/toolbox'
import {
  addOverlayInjectorDefenderExclusions,
  prepareOverlayInjectorDefenderExclusions,
} from '@/modules/electron-overlay-defender'

const VBCResourceExePath = path.join(
  EXTERNALS_DIR,
  process.arch === 'x64'
    ? '/vbc/VBCABLE_Setup_x64.exe'
    : '/vbc/VBCABLE_Setup.exe',
)

export interface RunningOverlayProgram {
  name: string
  executable: string
}

const readExecutableDescriptions = async (paths: string[]) => {
  const systemRoot = process.env.SystemRoot
  if (!paths.length || !systemRoot) return new Map<string, string>()

  const powershell = path.win32.join(
    systemRoot,
    'System32',
    'WindowsPowerShell',
    'v1.0',
    'powershell.exe',
  )
  const script = `
    $ErrorActionPreference = 'Stop'
    [Console]::OutputEncoding = [Text.UTF8Encoding]::new($false)
    $json = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String([Console]::In.ReadToEnd()))
    $descriptions = foreach ($file in (ConvertFrom-Json -InputObject $json)) {
      try {
        $version = [Diagnostics.FileVersionInfo]::GetVersionInfo($file)
        $description = $version.FileDescription
        if ([string]::IsNullOrWhiteSpace($description)) { $description = $version.ProductName }
        if (![string]::IsNullOrWhiteSpace($description)) {
          @{ file = $file; description = $description.Trim() }
        }
      } catch {
        # Processes without readable version metadata retain their executable name.
      }
    }
    ConvertTo-Json -InputObject @($descriptions | Where-Object { $_ }) -Compress
  `

  try {
    const output = await new Promise<string>((resolve, reject) => {
      const child = execFile(
        powershell,
        ['-NoLogo', '-NoProfile', '-NonInteractive', '-Command', script],
        { timeout: 5000, windowsHide: true, encoding: 'utf8' },
        (error, stdout) => (error ? reject(error) : resolve(stdout)),
      )
      child.stdin?.on('error', reject)
      child.stdin?.end(
        Buffer.from(JSON.stringify(paths), 'utf8').toString('base64'),
      )
    })
    const entries: { file: string; description: string }[] = JSON.parse(output)
    return new Map(entries.map(({ file, description }) => [file, description]))
  } catch {
    return new Map<string, string>()
  }
}

export const ElectronResources = () => {
  const getSudoOptions = () => ({
    name: app.name,
    // icns: '/Applications/Electron.app/Contents/Resources/Electron.icns', // (optional)
  })
  return {
    prepareOverlayInjectorDefenderExclusions,
    addOverlayInjectorDefenderExclusions,
    async getRunningOverlayPrograms(): Promise<RunningOverlayProgram[]> {
      const { list } = await si.processes()
      if (!list.length) throw new Error('Could not read the process list')
      const programs = new Map<
        string,
        { executable: string; files: Set<string> }
      >()
      for (const { name, path: file } of list) {
        // Only offer executable names that can be written as literal policy globs.
        if (!/\.exe$/i.test(name) || /[\\/:*?"<>|[\]{}]|[+@!]\(/.test(name))
          continue
        const key = name.toLowerCase()
        const program = programs.get(key) ?? {
          executable: name,
          files: new Set<string>(),
        }
        if (
          file &&
          path.win32.isAbsolute(file) &&
          path.win32.basename(file).toLowerCase() === key
        )
          program.files.add(file)
        programs.set(key, program)
      }
      const descriptions = await readExecutableDescriptions(
        [...programs.values()].flatMap(({ files }) => [...files]),
      )
      return [...programs.values()]
        .map(({ executable, files }) => ({
          executable,
          name:
            [...files].map((file) => descriptions.get(file)).find(Boolean) ??
            executable.slice(0, -4),
        }))
        .sort(
          (left, right) =>
            left.name.localeCompare(right.name) ||
            left.executable.localeCompare(right.executable),
        )
    },
    isVirtualAudioCableInstalled(): Promise<boolean> {
      return si.audio().then((audioData) => {
        const vbcDevices = filter(
          audioData,
          (device) => device.manufacturer === 'VB-Audio Software',
        )
        return Promise.resolve(!!vbcDevices.length)
      })
    },
    installVirtualAudioCable(): Promise<boolean> {
      const deferred = Deferred<boolean>()
      return si.audio().then((audioData) => {
        const vbcDevices = filter(
          audioData,
          (device) => device.manufacturer === 'VB-Audio Software',
        )
        if (!vbcDevices.length) {
          sudo.exec(
            `${JSON.stringify(VBCResourceExePath)} -i -h`,
            getSudoOptions(),
            (error) => {
              if (error) {
                return deferred.reject(error)
              }
              deferred.resolve(true)
            },
          )
        }
        return deferred.promise
      })
    },
    uninstallVirtualAudioCable(): Promise<boolean> {
      const deferred = Deferred<boolean>()
      return si.audio().then((audioData) => {
        const vbcDevices = filter(
          audioData,
          (device) => device.manufacturer === 'VB-Audio Software',
        )
        if (vbcDevices.length) {
          sudo.exec(
            `${JSON.stringify(VBCResourceExePath)} -u -h`,
            getSudoOptions(),
            (error) => {
              if (error) {
                return deferred.reject(error)
              }
              deferred.resolve(true)
            },
          )
        }
        return deferred.promise
      })
    },
  }
}

export default ElectronResources()
