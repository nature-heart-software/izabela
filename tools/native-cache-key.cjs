const { execFileSync } = require('node:child_process')
const { existsSync, readdirSync, readFileSync, statSync } = require('node:fs')
const os = require('node:os')
const path = require('node:path')

function command(file, args) {
  return execFileSync(file, args, {
    encoding: 'utf8',
    windowsHide: true,
    timeout: 15000,
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim()
}

function optionalCommand(file, args) {
  try {
    return command(file, args)
  } catch {
    return null
  }
}

function directories(directory) {
  if (!existsSync(directory)) return []
  return readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
}

function fileStamp(file) {
  if (!existsSync(file)) return null
  const { size, mtimeMs } = statSync(file)
  return { file, size, mtimeMs }
}

// These affect node-gyp, cmake-js or the compiler. Do not hash the entire PATH:
// pnpm adds different task-local .bin directories on nested invocations.
const environment = Object.fromEntries(
  Object.entries(process.env)
    .filter(([name]) =>
      /^(CC|CXX|CFLAGS|CXXFLAGS|CPPFLAGS|LDFLAGS|CL|_CL_|LINK|GYP_.*|CMAKE_.*|VCINSTALLDIR|VCTools.*|VSCMD_.*|VSINSTALLDIR|WindowsSDK.*|WindowsSdk.*|PYTHON|NODE_GYP_FORCE_PYTHON|npm_config_(arch|target_arch|runtime|target|disturl|nodedir|msvs_version|python|debug|build_from_source))$/i.test(
        name,
      ),
    )
    .sort(([left], [right]) => left.localeCompare(right)),
)

const key = {
  platform: process.platform,
  arch: process.arch,
  os: os.release(),
  node: process.version,
  nodeAbi: process.versions.modules,
  napi: process.versions.napi,
  environment,
  cmake: command('cmake', ['--version']).split(/\r?\n/)[0],
}

if (process.platform === 'win32') {
  const programFiles = process.env['ProgramFiles(x86)']
  const vswhere = path.join(
    programFiles,
    'Microsoft Visual Studio/Installer/vswhere.exe',
  )
  key.visualStudio = JSON.parse(
    command(vswhere, ['-all', '-products', '*', '-format', 'json']),
  )
    .map(({ installationPath, installationVersion }) => ({
      path: installationPath,
      version: installationVersion,
      toolsets: directories(path.join(installationPath, 'VC/Tools/MSVC')).map(
        (version) => ({
          version,
          compiler: fileStamp(
            path.join(
              installationPath,
              'VC/Tools/MSVC',
              version,
              'bin/Hostx64/x64/cl.exe',
            ),
          ),
        }),
      ),
      defaultToolset: existsSync(
        path.join(
          installationPath,
          'VC/Auxiliary/Build/Microsoft.VCToolsVersion.default.txt',
        ),
      )
        ? readFileSync(
            path.join(
              installationPath,
              'VC/Auxiliary/Build/Microsoft.VCToolsVersion.default.txt',
            ),
            'utf8',
          ).trim()
        : null,
      clang: fileStamp(
        path.join(installationPath, 'VC/Tools/Llvm/bin/clang-cl.exe'),
      ),
      msbuild: fileStamp(
        path.join(installationPath, 'MSBuild/Current/Bin/MSBuild.exe'),
      ),
    }))
    .sort((left, right) => left.path.localeCompare(right.path))
  key.windowsSdk = directories(
    path.join(programFiles, 'Windows Kits/10/Include'),
  )
  key.python = optionalCommand('py', ['--list-paths'])
  key.pythonOnPath = optionalCommand('where.exe', ['python'])
  key.pythonExecutables = [
    ...new Set([
      ...(key.python?.match(/[A-Za-z]:\\[^\r\n]+\.exe/g) || []),
      ...(key.pythonOnPath?.split(/\r?\n/) || []),
    ]),
  ]
    .sort()
    .map(fileStamp)
  key.cmakeOnPath = command('where.exe', ['cmake'])
} else {
  key.compiler = command(process.env.CXX || 'c++', ['--version'])
  key.python = command(process.env.PYTHON || 'python3', ['--version'])
}

process.stdout.write(JSON.stringify(key))
