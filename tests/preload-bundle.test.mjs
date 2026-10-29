import assert from 'node:assert/strict'
import { builtinModules } from 'node:module'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { build, loadConfigFromFile } from 'vite'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const app = resolve(root, 'apps/app')

test('the production preload graph excludes native window controllers and provider SDKs', async (t) => {
  const loaded = await loadConfigFromFile(
    { command: 'build', mode: 'production' },
    resolve(app, 'vite.config.ts'),
  )
  assert.ok(loaded)
  const result = await build({
    root: app,
    configFile: false,
    publicDir: false,
    logLevel: 'error',
    resolve: loaded.config.resolve,
    define: { 'process.env': 'process.env' },
    build: {
      write: false,
      lib: { entry: resolve(app, 'src/electron/preload.ts'), formats: ['cjs'] },
      rollupOptions: {
        external: [
          ...builtinModules,
          ...builtinModules.map((id) => `node:${id}`),
          'electron',
          ...loaded.config.build.rollupOptions.external,
        ],
      },
    },
  })
  const outputs = Array.isArray(result)
    ? result.flatMap((entry) => entry.output)
    : result.output
  const chunks = outputs.filter((output) => output.type === 'chunk')
  const modules = chunks.flatMap((chunk) =>
    Object.keys(chunk.modules).map((id) => id.replaceAll('\\', '/')),
  )
  const imports = chunks.flatMap((chunk) => chunk.imports)
  const forbidden =
    /speech-worker\/modules|electron-messenger-window|electron-overlay-window|plugins\/translation-engines\/[^/]+\/bridge\.ts|@aws-sdk|@azure|@google-cloud|(?:^|\/node_modules\/)openai(?:\/|$)|microsoft-cognitiveservices|(?:^|\/)koffi(?:\/|$)|(?:^|\/)forcefocus(?:\/|$)|electron-game-overlay/
  assert.deepEqual(
    modules.filter((id) => forbidden.test(id)),
    [],
  )
  assert.deepEqual(
    imports.filter((id) => forbidden.test(id)),
    [],
  )
  assert.ok(modules.some((id) => id.endsWith('/electron/preload-bridge.ts')))
  const registrations = modules.filter((id) =>
    id.endsWith('/register.preload.ts'),
  )
  assert.equal(
    registrations.length,
    4,
    'compile every translation preload registration',
  )
  t.diagnostic(
    `Compiled preload: ${chunks.reduce(
      (total, chunk) => total + Buffer.byteLength(chunk.code),
      0,
    )} bytes; ${modules.length} modules; no main-only or provider SDK imports`,
  )
})
