import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const workspace = readFileSync(
  new URL('../pnpm-workspace.yaml', import.meta.url),
  'utf8',
)
const lock = readFileSync(new URL('../pnpm-lock.yaml', import.meta.url), 'utf8')
const productionUndici = '7.30.1'

// Inspect pnpm's generated top-level sections and two-space entry blocks only;
// this is not a general YAML parser and needs no additional test dependencies.
function section(name) {
  const content = lock.split(`\n${name}:\n`)[1]?.split(/^\S/m)[0]
  assert.ok(content, `Missing lockfile section: ${name}`)
  return content
}

function entries(content) {
  return [...content.matchAll(/^  (\S.*):\n([\s\S]*?)(?=^  \S|(?![\s\S]))/gm)]
}

test('production OpenAI importers and snapshots retain their isolated undici peer', () => {
  const importers = entries(section('importers')).flatMap(([, name, body]) => {
    const version = body.match(
      /^      openai:\n        specifier: .+\n        version: (.+)$/m,
    )?.[1]
    return version ? [{ name, version }] : []
  })
  assert.ok(importers.length > 0, 'No production OpenAI importers found')
  for (const { name, version } of importers) {
    assert.ok(
      version.includes(`(undici@${productionUndici})`),
      `${name}: production OpenAI resolved ${version}; expected undici@${productionUndici}`,
    )
    assert.ok(
      section('snapshots').includes(`  openai@${version}:\n`),
      `${name}: missing OpenAI snapshot`,
    )
  }
  const snapshots = entries(section('snapshots')).filter(([, name]) =>
    name.startsWith('openai@'),
  )
  assert.ok(snapshots.length > 0, 'No OpenAI snapshots found')
  for (const [, name, body] of snapshots) {
    assert.ok(name.includes(`(undici@${productionUndici})`), name)
    assert.match(
      body,
      new RegExp(
        `^      undici: ${productionUndici.replaceAll('.', '\\.')}\n`,
        'm',
      ),
      `${name}: optional undici peer differs from the production policy`,
    )
  }
})

test('the SDK peer policy is scoped rather than a global undici override', () => {
  assert.match(workspace, /^  'openai@7\.45\.0>undici': 7\.30\.1$/m)
  assert.doesNotMatch(workspace, /^  ['"]?undici(?:@[^:'"]+)?['"]?:/m)
  const metadata = entries(section('packages')).find(([, name]) =>
    name.startsWith('openai@7.45.0'),
  )
  assert.ok(metadata, 'No OpenAI package metadata found')
  assert.match(metadata[2], /^      undici:\n        optional: true$/m)
})

test('production motion keeps magicast absent while coverage owns its dependency', () => {
  const root = entries(section('importers')).find(([, name]) => name === '.')
  assert.ok(root, 'No root importer found')
  const motionVersion = root[2].match(
    /^      '@vueuse\/motion':\n        specifier: .+\n        version: (.+)$/m,
  )?.[1]
  assert.ok(motionVersion, 'No production motion dependency found')
  assert.doesNotMatch(motionVersion, /magicast/)

  const snapshots = entries(section('snapshots'))
  const motion = snapshots.find(
    ([, name]) => name === `'@vueuse/motion@${motionVersion}'`,
  )
  assert.ok(motion, 'Missing isolated motion snapshot')
  assert.match(motion[2], /^      '@nuxt\/kit': 3\.21\.8$/m)
  const kit = snapshots.find(([, name]) => name === "'@nuxt/kit@3.21.8'")
  assert.ok(kit, 'Missing isolated Nuxt kit snapshot')
  assert.match(kit[2], /^      c12: 3\.3\.4$/m)
  const c12 = snapshots.find(([, name]) => name === 'c12@3.3.4')
  assert.ok(c12, 'Missing isolated c12 snapshot')
  assert.doesNotMatch(c12[2], /^      magicast:/m)

  const coverage = snapshots.filter(([, name]) =>
    name.startsWith("'@vitest/coverage-v8@"),
  )
  assert.ok(coverage.length > 0, 'No coverage snapshots found')
  for (const [, name, body] of coverage) {
    assert.match(body, /^      magicast: 0\.3\.5$/m, name)
  }
  assert.ok(snapshots.some(([, name]) => name === 'magicast@0.3.5'))
})

test('the optional magicast removal is scoped to the production c12 version', () => {
  assert.match(workspace, /^  'c12@3\.3\.4>magicast': '-'$/m)
  assert.doesNotMatch(workspace, /^  ['"]?magicast(?:@[^:'"]+)?['"]?:/m)
  const metadata = entries(section('packages')).find(
    ([, name]) => name === 'c12@3.3.4',
  )
  assert.ok(metadata, 'No c12 package metadata found')
  // pnpm retains registry peer metadata even when the scoped override removes
  // the resolved peer; the production snapshot above is the graph contract.
  assert.match(metadata[2], /^      magicast: '\*'$/m)
  assert.match(metadata[2], /^      magicast:\n        optional: true$/m)
})

test('jsdom retains its separate undici 8 dependency', () => {
  const snapshots = entries(section('snapshots')).filter(([, name]) =>
    name.startsWith('jsdom@'),
  )
  assert.ok(snapshots.length > 0, 'No jsdom snapshots found')
  for (const [, name, body] of snapshots) {
    assert.match(body, /^      undici: 8\.12\.3\n/m, name)
  }
  assert.match(section('snapshots'), /^  undici@8\.12\.3: /m)
  assert.match(section('snapshots'), /^  undici@7\.30\.1:/m)
})
