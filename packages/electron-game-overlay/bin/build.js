import { createRequire } from 'node:module'
import { spawn } from 'node:child_process'
import path from 'node:path'
import { copy, emptyDir } from 'fs-extra'
import { readFile, writeFile } from 'node:fs/promises'
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

// Patch only the staging copy: closing a window must also release its bitmap map.
// Match the complete pinned method so upstream changes require explicit review.
const overlayHeaderPath = path.join(
  packagePath,
  'electron-overlay/src/overlay.h',
)
const overlayHeader = await readFile(overlayHeaderPath, 'utf8')
const newline = overlayHeader.includes('\r\n') ? '\r\n' : '\n'
const closeWindow = `    Napi::Value closeWindow(const Napi::CallbackInfo& info)
    {
        Napi::Env env = info.Env();

        overlay::WindowClose message;
        message.windowId = info[0].ToNumber();
        this->_sendMessage(&message);

        auto it = std::find_if(windows_.begin(), windows_.end(), [windowId = message.windowId](const auto &window) {
            return windowId == window.windowId;
        });

        if (it != windows_.end())
        {
            windows_.erase(it);
        }

        return env.Undefined();
    }`.replaceAll('\n', newline)
if (overlayHeader.split(closeWindow).length !== 2) {
  throw new Error(
    'Unexpected gelectron closeWindow source; refusing native build',
  )
}
await writeFile(
  overlayHeaderPath,
  overlayHeader.replace(
    closeWindow,
    closeWindow.replace(
      '        return env.Undefined();',
      `        shareMemMap_.erase(message.windowId);${newline}        return env.Undefined();`,
    ),
  ),
)

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
