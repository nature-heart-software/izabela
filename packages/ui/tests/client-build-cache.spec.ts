import { spawnSync } from 'node:child_process'
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, expect, it } from 'vitest'

const roots: string[] = []
afterEach(() => {
  for (const root of roots.splice(0))
    rmSync(root, { recursive: true, force: true })
})

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'ui-client-build-'))
  roots.push(root)
  const tests = join(root, 'packages/ui/tests')
  mkdirSync(tests, { recursive: true })
  // Execute the unchanged helper and Panda launcher in real Node children.
  // Only the Vite, Vue plugin and Panda CLI dependency boundaries are fake;
  // emitted fixture files do not establish component compilation or rendering.
  for (const name of [
    'build-client.mjs',
    'prepare-panda.mjs',
    'client-build-cache.mjs',
  ]) {
    const source = fileURLToPath(new URL(name, import.meta.url))
    if (existsSync(source)) copyFileSync(source, join(tests, name))
  }
  function dependency(name: string, source: string) {
    const directory = join(root, 'node_modules', name)
    mkdirSync(directory, { recursive: true })
    writeFileSync(
      join(directory, 'package.json'),
      JSON.stringify({ name, type: 'module', main: 'index.js' }),
    )
    writeFileSync(join(directory, 'index.js'), source)
  }
  dependency(
    '@vitejs/plugin-vue',
    'export default () => ({ name: "fixture-vue" })',
  )
  dependency(
    'vite',
    `
    import { appendFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs'
    import { join } from 'node:path'
    export async function build(config) {
      appendFileSync(process.env.FIXTURE_AUDIT, 'build\\n')
      mkdirSync(config.build.outDir, { recursive: true })
      writeFileSync(join(config.build.outDir, config.build.lib.fileName()), 'fixture JavaScript')
      writeFileSync(join(config.build.outDir, 'style.css'), 'fixture CSS')
      if (existsSync(process.env.FIXTURE_REJECT)) throw new Error('fixture rejected build')
    }
  `,
  )
  dependency('@pandacss/dev', '')
  writeFileSync(
    join(root, 'node_modules/@pandacss/dev/bin.js'),
    `
    import { appendFileSync } from 'node:fs'
    appendFileSync(process.env.FIXTURE_AUDIT, process.argv[2] + '\\n')
  `,
  )
  const audit = join(root, 'audit.txt')
  const output = join(root, 'coverage/ui-client')
  return {
    output,
    marker: join(output, '.client-build-success'),
    reject: join(root, 'reject'),
    run(id?: string) {
      const env: NodeJS.ProcessEnv = {
        ...process.env,
        FIXTURE_AUDIT: audit,
        FIXTURE_REJECT: join(root, 'reject'),
      }
      delete env.UI_TEST_RUN_ID
      if (id !== undefined) env.UI_TEST_RUN_ID = id
      const result = spawnSync(
        process.execPath,
        [join(tests, 'build-client.mjs')],
        {
          cwd: root,
          env,
          encoding: 'utf8',
          timeout: 10000,
        },
      )
      expect(result.error, result.stdout + result.stderr).toBeUndefined()
      return result
    },
    events() {
      return readFileSync(audit, 'utf8').trim().split('\n')
    },
  }
}

it('reuses preparation and build across real children with the same invocation identity', () => {
  const f = fixture()
  for (let attempt = 0; attempt < 2; attempt++) {
    const result = f.run('same-invocation')
    expect(result.status, result.stderr).toBe(0)
  }
  expect(f.events().filter((event) => event === 'build')).toHaveLength(1)
  expect(f.events()).toEqual(['codegen', 'cssgen', 'build'])
  expect(readFileSync(f.marker, 'utf8')).toBe('same-invocation')
})

it('rebuilds when a different invocation encounters existing outputs', () => {
  const f = fixture()
  for (const id of ['first-invocation', 'next-invocation']) {
    const result = f.run(id)
    expect(result.status, result.stderr).toBe(0)
    expect(readFileSync(f.marker, 'utf8')).toBe(id)
  }
  expect(f.events()).toEqual([
    'codegen',
    'cssgen',
    'build',
    'codegen',
    'cssgen',
    'build',
  ])
})

it.each(['test-client.js', 'style.css'])(
  'rebuilds if required output %s is missing',
  (name) => {
    const f = fixture()
    const first = f.run('same-invocation')
    expect(first.status, first.stderr).toBe(0)
    rmSync(join(f.output, name))
    const second = f.run('same-invocation')
    expect(second.status, second.stderr).toBe(0)
    expect(existsSync(join(f.output, name))).toBe(true)
    expect(f.events()).toEqual([
      'codegen',
      'cssgen',
      'build',
      'codegen',
      'cssgen',
      'build',
    ])
  },
)

it('requires a success marker even if both output files exist', () => {
  const f = fixture()
  const first = f.run('same-invocation')
  expect(first.status, first.stderr).toBe(0)
  rmSync(f.marker)
  const second = f.run('same-invocation')
  expect(second.status, second.stderr).toBe(0)
  expect(f.events()).toEqual([
    'codegen',
    'cssgen',
    'build',
    'codegen',
    'cssgen',
    'build',
  ])
})

it.each([undefined, '', '   '])(
  'always rebuilds unidentified calls (%j) and removes prior success',
  (id) => {
    const f = fixture()
    const seeded = f.run('prior-invocation')
    expect(seeded.status, seeded.stderr).toBe(0)
    for (let attempt = 0; attempt < 2; attempt++) {
      const result = f.run(id)
      expect(result.status, result.stderr).toBe(0)
      expect(existsSync(f.marker)).toBe(false)
    }
    expect(f.events()).toEqual(
      Array.from({ length: 3 }, () => ['codegen', 'cssgen', 'build']).flat(),
    )
  },
)

it('invalidates old success before a rejected build and rebuilds on retry', () => {
  const f = fixture()
  const seeded = f.run('prior-invocation')
  expect(seeded.status, seeded.stderr).toBe(0)
  writeFileSync(f.reject, 'reject the next build')
  const rejected = f.run('next-invocation')
  expect(rejected.status).not.toBe(0)
  expect(rejected.stderr).toContain('fixture rejected build')
  expect(existsSync(f.marker)).toBe(false)
  expect(existsSync(join(f.output, 'test-client.js'))).toBe(true)
  expect(existsSync(join(f.output, 'style.css'))).toBe(true)
  rmSync(f.reject)
  // Returning to the old identity must not reuse outputs from the rejected build.
  const retry = f.run('prior-invocation')
  expect(retry.status, retry.stderr).toBe(0)
  expect(readFileSync(f.marker, 'utf8')).toBe('prior-invocation')
  const reused = f.run('prior-invocation')
  expect(reused.status, reused.stderr).toBe(0)
  expect(f.events()).toEqual(
    Array.from({ length: 3 }, () => ['codegen', 'cssgen', 'build']).flat(),
  )
})
