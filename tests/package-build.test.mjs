import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const readPackage = (directory) =>
  JSON.parse(readFileSync(resolve(root, directory, 'package.json'), 'utf8'))

// The overlay's advertised entrypoints are copied by its Windows-native build.
const directories = readdirSync(resolve(root, 'packages'), {
  withFileTypes: true,
})
  .filter(
    (entry) => entry.isDirectory() && entry.name !== 'electron-game-overlay',
  )
  .map((entry) => `packages/${entry.name}`)
  .sort()
directories.push('apps/app-server')

for (const directory of directories) {
  const pkg = readPackage(directory)
  test(`${pkg.name}: advertised package entrypoints exist after building`, () => {
    for (const field of ['main', 'module', 'types', 'typings']) {
      if (!pkg[field]) continue
      const filename = resolve(root, directory, pkg[field])
      assert.ok(
        existsSync(filename),
        `${pkg.name}.${field}: missing ${pkg[field]}`,
      )
    }
  })
}

for (const directory of ['packages/icons', 'packages/ui']) {
  test(`${directory}: every Vue component has a generated declaration`, () => {
    const source = resolve(root, directory, 'src')
    const components = readdirSync(source, { recursive: true }).filter((name) =>
      name.endsWith('.vue'),
    )
    assert.ok(components.length > 0, 'expected Vue component sources')
    for (const component of components) {
      const declaration = resolve(root, directory, 'dist', `${component}.d.ts`)
      assert.ok(existsSync(declaration), `missing declaration: ${component}`)
      assert.doesNotMatch(
        readFileSync(declaration, 'utf8'),
        /\.pnpm\//,
        `non-portable declaration: ${component}`,
      )
    }
  })
}

test('UI public declaration dependencies are directly resolvable', () => {
  const pkg = readPackage('packages/ui')
  const require = createRequire(resolve(root, 'packages/ui/package.json'))
  for (const dependency of [
    'csstype',
    'tippy.js',
    '@zag-js/interact-outside',
  ]) {
    assert.ok(
      pkg.dependencies[dependency],
      `missing direct dependency: ${dependency}`,
    )
    assert.ok(existsSync(require.resolve(`${dependency}/package.json`)))
  }
})

test('the server declares and can resolve its direct WebSocket dependency', () => {
  const pkg = readPackage('apps/app-server')
  assert.ok(pkg.dependencies.ws, 'ws must be a direct runtime dependency')
  const require = createRequire(resolve(root, 'apps/app-server/package.json'))
  assert.ok(existsSync(require.resolve('ws')))
})

for (const directory of ['packages/native-keymap', 'packages/win-control']) {
  test(`${directory}: native compilation cannot reuse a cross-platform cache`, () => {
    const pkg = readPackage(directory)
    assert.equal(pkg.nx?.targets?.build?.cache, false)
  })
}

test('direct desktop development rebuilds native modules before launching Vite', () => {
  const pkg = readPackage('apps/app')
  assert.match(pkg.scripts.dev, /^pnpm run rebuild && vite$/)
})
