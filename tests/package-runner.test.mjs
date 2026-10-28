import assert from 'node:assert/strict'
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  copyFileSync,
  rmSync,
  existsSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

function runFixture(packages, selections = []) {
  const directory = mkdtempSync(join(tmpdir(), 'package-runner-'))
  try {
    mkdirSync(join(directory, 'tools'), { recursive: true })
    mkdirSync(join(directory, 'packages'), { recursive: true })
    mkdirSync(join(directory, 'apps'), { recursive: true })
    mkdirSync(join(directory, 'apps/app'), { recursive: true })
    writeFileSync(
      join(directory, 'apps/app/package.json'),
      JSON.stringify({ name: 'excluded-desktop' }),
    )
    mkdirSync(join(directory, 'node_modules/vitest'), { recursive: true })
    copyFileSync(
      join(root, 'tools/test-packages.mjs'),
      join(directory, 'tools/test-packages.mjs'),
    )
    writeFileSync(
      join(directory, 'node_modules/vitest/package.json'),
      JSON.stringify({ name: 'vitest', version: '0.0.0-fixture' }),
    )
    // This reporter fixture tests runner control flow, not package behavior or Vitest itself.
    writeFileSync(
      join(directory, 'node_modules/vitest/vitest.mjs'),
      `
      import { readFileSync, writeFileSync } from 'node:fs'
      import { join } from 'node:path'
      const pkg = JSON.parse(readFileSync(join(process.argv[3], 'package.json'), 'utf8'))
      const output = process.argv.find(arg => arg.startsWith('--outputFile=')).slice('--outputFile='.length)
      writeFileSync(output, pkg.fixtureMalformed ? 'incomplete-json' : JSON.stringify({ testResults: [{ assertionResults: pkg.fixtureAssertions }] }))
    `,
    )
    for (const pkg of packages) {
      const packageDirectory = pkg.directory || join('packages', pkg.name)
      const path = join(directory, packageDirectory)
      mkdirSync(join(path, 'tests'), { recursive: true })
      writeFileSync(
        join(path, 'package.json'),
        JSON.stringify({
          name: pkg.name,
          fixtureAssertions: pkg.assertions,
          fixtureMalformed: pkg.malformed,
          fixtureTypeExit: pkg.typeExit,
          scripts:
            pkg.typeExit === undefined ? {} : { 'test:types': 'fixture' },
        }),
      )
      if (pkg.hasSuite !== false)
        writeFileSync(
          join(path, 'tests/example.spec.ts'),
          '// Reporter-control fixture; not executed as a real package test.\n',
        )
      if (pkg.seedReport) {
        mkdirSync(join(directory, 'coverage/package-results'), {
          recursive: true,
        })
        writeFileSync(
          join(
            directory,
            'coverage/package-results',
            packageDirectory.replace(/[\\/]/g, '-') + '.json',
          ),
          JSON.stringify({ testResults: [{ assertionResults: [passed] }] }),
        )
      }
    }
    const packageManager = join(directory, 'fixture-package-manager.mjs')
    writeFileSync(
      packageManager,
      `
      import { readFileSync } from 'node:fs'
      import { join } from 'node:path'
      // Fixture-only type-check exit status; this is not a TypeScript compiler substitute.
      const pkg = JSON.parse(readFileSync(join(process.argv[3], 'package.json'), 'utf8'))
      process.exit(pkg.fixtureTypeExit)
    `,
    )
    const run = spawnSync(
      process.execPath,
      ['tools/test-packages.mjs', ...selections],
      {
        cwd: directory,
        encoding: 'utf8',
        timeout: 30000,
        env: { ...process.env, npm_execpath: packageManager },
      },
    )
    assert.ifError(run.error)
    const summaryPath = join(directory, 'coverage/package-results/summary.json')
    const summary = existsSync(summaryPath)
      ? JSON.parse(readFileSync(summaryPath, 'utf8'))
      : null
    const reports = Object.fromEntries(
      packages.map((pkg) => [
        pkg.name,
        existsSync(
          join(
            directory,
            'coverage/package-results',
            (pkg.directory || join('packages', pkg.name)).replace(
              /[\\/]/g,
              '-',
            ) + '.json',
          ),
        ),
      ]),
    )
    return {
      exitCode: run.status,
      summary,
      reports,
      output: run.stdout + run.stderr,
    }
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
}

const passed = { fullName: 'fixture ordinary contract', status: 'passed' }

test('package runner includes the local server while excluding the desktop app', () => {
  const result = runFixture([
    {
      name: '@apps/app-server',
      directory: join('apps', 'app-server'),
      assertions: [passed],
    },
  ])
  assert.equal(result.exitCode, 0, result.output)
  assert.equal(result.summary.expectedPackages, 1)
  assert.equal(result.summary.results[0].name, '@apps/app-server')
})

test('package runner rejects an unknown selection even alongside a valid package', () => {
  const result = runFixture(
    [{ name: 'covered', assertions: [passed] }],
    ['covered', 'unknown'],
  )
  assert.equal(result.exitCode, 1)
  assert.match(result.output, /Unknown package: unknown/)
  assert.equal(result.summary, null)
})

test('package runner records type-check failures and continues to later packages', () => {
  const result = runFixture([
    { name: 'a-bad-types', assertions: [passed], typeExit: 2 },
    { name: 'b-good-types', assertions: [passed], typeExit: 0 },
  ])
  assert.equal(result.exitCode, 1)
  assert.deepEqual(
    result.summary.results.map((item) => item.typecheck),
    ['failed', 'passed'],
  )
  assert.deepEqual(
    result.summary.results.map((item) => item.status),
    ['failed', 'passed'],
  )
})

test('package runner removes an old report when a package loses its test suite', () => {
  const result = runFixture([
    { name: 'missing', hasSuite: false, seedReport: true, assertions: [] },
  ])
  assert.equal(result.exitCode, 1)
  assert.equal(result.summary.results[0].status, 'missing-suite')
  assert.equal(result.reports.missing, false)
})

test('package runner rejects missing suites while continuing to later packages', () => {
  const result = runFixture([
    { name: 'a-missing', hasSuite: false, assertions: [] },
    { name: 'b-covered', assertions: [passed] },
  ])
  assert.equal(result.exitCode, 1)
  assert.equal(result.summary.expectedPackages, 2)
  assert.deepEqual(
    result.summary.results.map((item) => item.status),
    ['missing-suite', 'passed'],
  )
})

test('package runner rejects skipped cases instead of claiming complete coverage', () => {
  const result = runFixture([
    {
      name: 'partial',
      assertions: [
        passed,
        { fullName: 'fixture skipped contract', status: 'pending' },
      ],
    },
  ])
  assert.equal(result.exitCode, 1)
  assert.equal(result.summary.results[0].skipped, 1)
  assert.equal(result.summary.results[0].status, 'failed')
})

test('package runner records malformed reports and still checks later packages', () => {
  const result = runFixture([
    { name: 'a-malformed', malformed: true, assertions: [passed] },
    { name: 'b-covered', assertions: [passed] },
  ])
  assert.equal(result.exitCode, 1)
  assert.ok(result.summary, 'runner must still write a complete report')
  assert.deepEqual(
    result.summary.results.map((item) => item.status),
    ['failed', 'passed'],
  )
  assert.equal(result.summary.results[0].error, 'Invalid Vitest JSON report')
})

test('package runner separates ordinary passes from named expected failures', () => {
  const result = runFixture([
    {
      name: 'covered',
      assertions: [
        passed,
        {
          fullName: '[known issue] fixture desired contract',
          status: 'passed',
        },
      ],
    },
  ])
  assert.equal(result.exitCode, 0)
  assert.equal(result.summary.expectedPackages, 1)
  assert.equal(result.summary.results[0].passed, 1)
  assert.deepEqual(result.summary.results[0].expectedFailures, [
    '[known issue] fixture desired contract',
  ])
})

test('package runner rejects a suite containing only expected failures', () => {
  const result = runFixture([
    {
      name: 'uncovered',
      assertions: [
        {
          fullName: '[known issue] fixture desired contract',
          status: 'passed',
        },
      ],
    },
  ])
  assert.equal(result.exitCode, 1)
  assert.equal(result.summary.results[0].passed, 0)
})

test('package runner rejects empty successful reporter output', () => {
  const result = runFixture([{ name: 'empty', assertions: [] }])
  assert.equal(result.exitCode, 1)
  assert.equal(result.summary.results[0].tests, 0)
})
