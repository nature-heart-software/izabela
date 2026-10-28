import {
  mkdirSync,
  readFileSync,
  readdirSync,
  existsSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, relative, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(import.meta.url)
const vitest = join(
  dirname(require.resolve('vitest/package.json')),
  'vitest.mjs',
)
const requested = process.argv.slice(2).filter((argument) => argument !== '--')
const packages = ['packages', 'apps'].flatMap((directory) =>
  readdirSync(join(root, directory), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(directory, entry.name))
    .filter((directory) => directory !== join('apps', 'app'))
    .filter((directory) => existsSync(join(root, directory, 'package.json')))
    .map((directory) => ({
      directory,
      ...JSON.parse(
        readFileSync(join(root, directory, 'package.json'), 'utf8'),
      ),
    })),
)
const selected = requested.length
  ? packages.filter((pkg) =>
      requested.some((name) =>
        [pkg.name, pkg.directory, pkg.directory.split(/[\\/]/).at(-1)].includes(
          name,
        ),
      ),
    )
  : packages
if (!selected.length) throw new Error('No matching package selected')
for (const name of requested) {
  if (
    !selected.some((pkg) =>
      [pkg.name, pkg.directory, pkg.directory.split(/[\\/]/).at(-1)].includes(
        name,
      ),
    )
  ) {
    throw new Error(`Unknown package: ${name}`)
  }
}
const output = join(root, 'coverage', 'package-results')
mkdirSync(output, { recursive: true })
const results = []
for (const pkg of selected) {
  const report = join(output, pkg.directory.replace(/[\\/]/g, '-') + '.json')
  rmSync(report, { force: true })
  const files = readdirSync(join(root, pkg.directory), { recursive: true })
    .filter(
      (name) =>
        !name
          .split(/[\\/]/)
          .some((part) => ['node_modules', 'dist', 'build'].includes(part)),
    )
    .filter((name) => /\.spec\.(?:ts|mts)$/.test(name))
  if (!files.length) {
    results.push({
      name: pkg.name,
      directory: pkg.directory,
      status: 'missing-suite',
      tests: 0,
    })
    console.error(`FAIL ${pkg.name}: no package-owned test suite`)
    continue
  }
  console.log(
    `\nTesting ${pkg.name} (${relative(root, join(root, pkg.directory))})`,
  )
  const run = spawnSync(
    process.execPath,
    [vitest, 'run', pkg.directory, '--reporter=json', `--outputFile=${report}`],
    {
      cwd: root,
      env: process.env,
      stdio: 'inherit',
      timeout: 180000,
    },
  )
  let assertions = []
  let reportError
  if (existsSync(report)) {
    try {
      const data = JSON.parse(readFileSync(report, 'utf8'))
      assertions = data.testResults.flatMap((file) => file.assertionResults)
      if (
        !assertions.every(
          (item) =>
            typeof item?.fullName === 'string' &&
            [
              'passed',
              'failed',
              'pending',
              'skipped',
              'todo',
              'disabled',
            ].includes(item.status),
        )
      )
        throw new Error('Invalid assertion shape')
    } catch {
      assertions = []
      reportError = 'Invalid Vitest JSON report'
    }
  }
  const expectedFailures = assertions.filter((item) =>
    item.fullName.includes('[known issue]'),
  )
  const passed = assertions.filter(
    (item) =>
      item.status === 'passed' && !item.fullName.includes('[known issue]'),
  ).length
  const failed = assertions.filter((item) => item.status === 'failed').length
  const skipped = assertions.filter((item) =>
    ['pending', 'skipped', 'todo', 'disabled'].includes(item.status),
  ).length
  let typecheck = 'not-configured'
  if (pkg.scripts?.['test:types']) {
    if (!process.env.npm_execpath) {
      throw new Error(
        'Run through pnpm test:packages to execute package type checks',
      )
    }
    const checked = spawnSync(
      process.execPath,
      [process.env.npm_execpath, '--dir', pkg.directory, 'run', 'test:types'],
      { cwd: root, env: process.env, stdio: 'inherit', timeout: 180000 },
    )
    typecheck = checked.status === 0 ? 'passed' : 'failed'
  }
  const success =
    run.status === 0 &&
    assertions.length > 0 &&
    passed > 0 &&
    failed === 0 &&
    skipped === 0 &&
    typecheck !== 'failed'
  results.push({
    name: pkg.name,
    directory: pkg.directory,
    status: success ? 'passed' : 'failed',
    tests: assertions.length,
    passed,
    failed,
    skipped,
    expectedFailures: expectedFailures.map((item) => item.fullName),
    exitCode: run.status,
    typecheck,
    error: run.error?.message || reportError,
  })
  console.log(
    `${success ? 'PASS' : 'FAIL'} ${pkg.name}: ${passed} ordinary passes, ${
      expectedFailures.length
    } expected-failure cases, ${skipped} skipped`,
  )
}
writeFileSync(
  join(output, 'summary.json'),
  JSON.stringify({ expectedPackages: selected.length, results }, null, 2) +
    '\n',
)
console.log(
  `\nVerified ${results.filter((item) => item.status === 'passed').length}/${
    selected.length
  } package suites`,
)
process.exitCode =
  results.length !== selected.length ||
  results.some((item) => item.status !== 'passed')
    ? 1
    : 0
