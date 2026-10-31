import path from 'node:path'
import { Buffer } from 'node:buffer'

export function injectorExclusionPaths(
  runtimeDirectory: string,
  applicationRunsDirectory: string,
  sharedRunsDirectory: string,
): string[] {
  const directory = (value: string) => {
    const normalized = path.win32.normalize(value)
    if (
      !/^[a-z]:\\/i.test(normalized) ||
      normalized === path.win32.parse(normalized).root ||
      /[\x00-\x1f*?%"<>|]/.test(normalized)
    )
      throw new Error('Unsupported injector directory')
    return normalized
  }
  const runtime = directory(runtimeDirectory)
  const runs = [
    directory(applicationRunsDirectory),
    directory(sharedRunsDirectory),
  ]
  const paths = ['inject.exe', 'inject32.exe'].flatMap((name) => [
    path.win32.join(runtime, name),
    ...runs.map((root) => path.win32.join(root, '*', name)),
  ])
  return [
    ...new Map(paths.map((value) => [value.toLowerCase(), value])).values(),
  ]
}

export function defenderExclusionCommand(
  paths: readonly string[],
  systemDirectory: string,
): string {
  const executable = path.win32.join(
    systemDirectory,
    'WindowsPowerShell',
    'v1.0',
    'powershell.exe',
  )
  if (!/^[a-z]:\\/i.test(executable) || /[\x00-\x1f"%&|<>!^]/.test(executable))
    throw new Error('Unsupported Windows directory')
  // Paths are data, never PowerShell or cmd source. No renderer-supplied paths
  // reach this helper; callers generate the fixed SDK injector plan in main.
  const encodedPaths = Buffer.from(JSON.stringify(paths), 'utf8').toString(
    'base64',
  )
  const script = `
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$paths = [string[]]([Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('${encodedPaths}')) | ConvertFrom-Json)
$existing = @((Get-MpPreference -ErrorAction Stop).ExclusionPath)
$missing = @($paths | Where-Object { $existing -notcontains $_ })
if ($missing.Count -gt 0) {
  Add-MpPreference -ExclusionPath $missing -ErrorAction Stop | Out-Null
}
$configured = @((Get-MpPreference -ErrorAction Stop).ExclusionPath)
if (@($paths | Where-Object { $configured -notcontains $_ }).Count -ne 0) {
  throw 'Defender did not retain the requested exclusions'
}
@{ status = 'added'; count = $paths.Count } | ConvertTo-Json -Compress
`
  return `"${executable}" -NoLogo -NoProfile -NonInteractive -WindowStyle Hidden -EncodedCommand ${Buffer.from(
    script,
    'utf16le',
  ).toString('base64')}`
}
