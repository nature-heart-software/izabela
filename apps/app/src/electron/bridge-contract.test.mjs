import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import ts from 'typescript'

const source = (path) => fileURLToPath(new URL(path, import.meta.url))
const samePath = (left, right) =>
  left.replaceAll('\\', '/') === right.replaceAll('\\', '/')
const directory = source('../..')
const ownedFiles = [
  source('./bridge-contract.ts'),
  source('./preload-bridge.ts'),
  source('./bridge.ts'),
  source('./bridge-contract.types.ts'),
]

function checkTypes({ addImplementationMethod = false } = {}) {
  const options = {
    strict: true,
    noEmit: true,
    skipLibCheck: true,
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    allowImportingTsExtensions: true,
    allowSyntheticDefaultImports: true,
    esModuleInterop: true,
    resolveJsonModule: true,
    baseUrl: directory,
    types: ['node', 'vite/client'],
    paths: {
      '@/*': ['src/*'],
      '@root/*': ['./*'],
      '@packages/electron-bridger': [
        '../../packages/electron-bridger/src/main.ts',
      ],
    },
  }
  const host = ts.createCompilerHost(options)
  const readFile = host.readFile.bind(host)
  host.readFile = (filename) => {
    const text = readFile(filename)
    if (
      addImplementationMethod &&
      samePath(filename, source('../modules/electron-display/index.ts'))
    )
      return text.replace(
        'export const ElectronDisplay = () => ({',
        'export const ElectronDisplay = () => ({ getDisplayCount(): number { return 0 },',
      )
    return text
  }
  const program = ts.createProgram(ownedFiles, options, host)
  // Other application modules have their own existing diagnostics. Check the real
  // imported implementation types, without claiming a workspace-wide type pass.
  const diagnostics = ownedFiles.flatMap((filename) => {
    const file = program.getSourceFile(filename)
    assert.ok(file, `Missing checked source: ${filename}`)
    return [
      ...program.getSyntacticDiagnostics(file),
      ...program.getSemanticDiagnostics(file),
    ]
  })
  return diagnostics.map((diagnostic) => ({
    file: diagnostic.file.fileName,
    code: diagnostic.code,
    message: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
  }))
}

test('contract, preload registration and Window types pass focused TypeScript checks', () => {
  assert.deepEqual(checkTypes(), [])
})

test('adding a real implementation method requires updating the preload contract', () => {
  const diagnostics = checkTypes({ addImplementationMethod: true })
  assert.ok(
    diagnostics.some(
      ({ file, message }) =>
        samePath(file, source('./bridge-contract.ts')) &&
        message.includes('getDisplayCount') &&
        message.includes('missing'),
    ),
    JSON.stringify(diagnostics, null, 2),
  )
})
