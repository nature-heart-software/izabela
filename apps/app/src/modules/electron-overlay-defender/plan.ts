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
  // pnpm changes this directory when the SDK version or Electron peer changes.
  // Wildcard only that package's version segment, retaining its native SDK path.
  const runtime = directory(runtimeDirectory).replace(
    /(\\node_modules\\\.pnpm\\)electron-game-overlay@[^\\]+(\\node_modules\\electron-game-overlay\\dist\\runtime\\win32-x64\\reshade)\\?$/i,
    '$1electron-game-overlay@*$2',
  )
  const runs = [
    directory(applicationRunsDirectory),
    directory(sharedRunsDirectory),
  ]
  // Defender's folder wildcard spans one level, not an arbitrary-depth glob.
  // Match injector filenames only, including both shipped architectures and
  // replacement copies in future SDK runs; never exclude the whole run folder.
  const paths = [
    path.win32.join(runtime, 'inject*.exe'),
    // SDK payload caches can be siblings of the run root. Keep that root's
    // fixed prefix and injector filename while allowing its cache suffix.
    ...runs.map((root) =>
      path.win32.join(root.replace(/\\+$/, '') + '*', '*', 'inject*.exe'),
    ),
  ]
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
