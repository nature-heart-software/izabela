import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const root = new URL('../', import.meta.url)
const read = (path) => readFileSync(new URL(path, root), 'utf8')

test('Ark overlays do not require Tippy packages in workspace manifests or lockfile', () => {
  for (const path of ['package.json', 'packages/ui/package.json']) {
    const manifest = JSON.parse(read(path))
    for (const section of [
      'dependencies',
      'devDependencies',
      'optionalDependencies',
      'peerDependencies',
    ]) {
      for (const name of ['vue-tippy', 'tippy.js']) {
        assert.equal(
          manifest[section]?.[name],
          undefined,
          `${path}: ${section}.${name}`,
        )
      }
    }
  }
  assert.equal(
    /(?:vue-tippy|tippy\.js)(?:@|:)/.test(read('pnpm-lock.yaml')),
    false,
    'lockfile contains a Tippy package',
  )
})

test('tooltip and menu public option types have no Tippy import', () => {
  for (const path of [
    'packages/ui/src/components/overlay/Tooltip/tooltip.shared.ts',
    'packages/ui/src/components/overlay/ContextMenu/context-menu.shared.ts',
  ]) {
    assert.doesNotMatch(read(path), /from\s+['"](?:vue-tippy|tippy\.js)['"]/)
  }
})

test('desktop overlay hitboxes use the Ark positioner boundary', () => {
  const source = read('apps/app/src/plugins/hitbox.ts')
  assert.doesNotMatch(source, /\.tippy-box/)
  assert.match(source, /watchHitbox\('\[data-part="positioner"\]'\)/)
})
