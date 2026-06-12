import { createRequire } from 'node:module'
import { spawn } from 'node:child_process'
import os from 'node:os'
import path from 'node:path'
import { copy, emptyDir } from 'fs-extra'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)
const sourcePackagePath = path.parse(require.resolve('gelectron/package.json')).dir
const packagePath = path.join(os.tmpdir(), 'izabela-gelectron-build')

function run(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env: process.env,
      shell: true,
      stdio: 'inherit',
    })

    child.on('exit', (code) => {
      if (code === 0) {
        resolve()
        return
      }

      reject(new Error(`${command} ${args.join(' ')} exited with code ${code}`))
    })
  })
}

await emptyDir(packagePath)
await copy(sourcePackagePath, packagePath, {
  filter: (src) => {
    const relativePath = path.relative(sourcePackagePath, src)
    return !relativePath.split(path.sep).some((part) =>
      ['node_modules', 'build_x64'].includes(part),
    )
  },
})

await run(
  'pnpm',
  ['install', '--ignore-workspace', '--config.dangerously-allow-all-builds=true'],
  packagePath,
)
await run('pnpm', ['run', 'build:addon:x64'], packagePath)

await copy(`${packagePath}/electron-overlay`, path.resolve(__dirname, '../dist'))
await copy(
  `${packagePath}/electron-overlay/index.js`,
  path.resolve(__dirname, '../dist/index.cjs'),
)
await copy(
  `${packagePath}/game-overlay/prebuilt/injector_helper.exe`,
  path.resolve(__dirname, '../dist/injector_helper.exe'),
)
await copy(
  `${packagePath}/game-overlay/prebuilt/injector_helper.x64.exe`,
  path.resolve(__dirname, '../dist/injector_helper.x64.exe'),
)
await copy(
  `${packagePath}/game-overlay/prebuilt/n_overlay.dll`,
  path.resolve(__dirname, '../dist/n_overlay.dll'),
)
await copy(
  `${packagePath}/game-overlay/prebuilt/n_overlay.x64.dll`,
  path.resolve(__dirname, '../dist/n_overlay.x64.dll'),
)
