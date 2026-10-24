import { createRequire } from 'node:module'
import { spawn } from 'node:child_process'
import path from 'node:path'
import { copy, emptyDir } from 'fs-extra'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)
const sourcePackagePath = path.parse(
  require.resolve('gelectron/package.json'),
).dir
const packagePath = path.resolve(__dirname, '../build/gelectron')
const electronVersion = require('../../../apps/app/package.json')
  .devDependencies.electron

function run(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env: process.env,
      stdio: 'inherit',
    })

    child.on('error', reject)
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
    return !relativePath
      .split(path.sep)
      .some((part) => ['node_modules', 'build_x64'].includes(part))
  },
})

await run(
  process.execPath,
  [
    require.resolve('cmake-js/bin/cmake-js'),
    'compile',
    '--runtime',
    'electron',
    '--runtime-version',
    electronVersion,
    '--arch',
    process.arch,
    '-G',
    'Visual Studio 17 2022',
    '-A',
    process.arch === 'arm64' ? 'ARM64' : 'x64',
    '-O',
    'build_x64',
    '--CDROOT_DIR=' + packagePath.replaceAll('\\', '/'),
  ],
  packagePath,
)

await copy(
  `${packagePath}/electron-overlay`,
  path.resolve(__dirname, '../dist'),
)
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
