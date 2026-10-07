'use strict'
const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')

const path = require('node:path')
const { spawnSync } = require('node:child_process')
const root = path.resolve(__dirname, '..')
const checker = 'tests/design-system-docs.test.cjs'
const barrel = 'packages/ui/src/components/index.ts'
const adapter = 'packages/ui/src/styles/tokens.ts'
const helpers = 'packages/ui/src/utils/css-in-js.ts'
const doc = 'DESIGN_SYSTEM.md'
function fixture(run) {
  // Hosted scratch is persistent-safe; never fall back to the system temp dir.
  const scratch = process.env.TMPDIR || '/opt/data/cache/scratch'
  fs.mkdirSync(scratch, { recursive: true })
  const dir = fs.mkdtempSync(path.join(scratch, 'design-docs-checker-'))
  try {
    for (const file of [
      checker,
      doc,
      'packages/design-tokens/src',
      'packages/ui/src/themes',
      adapter,
      helpers,
      'packages/ui/src/components',
    ]) {
      fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true })
      fs.cpSync(path.join(root, file), path.join(dir, file), {
        recursive: true,
      })
    }
    const edit = (file, change) => {
      const target = path.join(dir, file)
      fs.writeFileSync(target, change(fs.readFileSync(target, 'utf8')))
    }
    run({ dir, edit })
  } finally {
    fs.rmSync(dir, { recursive: true, force: true })
  }
}
function execute(dir) {
  const env = { ...process.env }
  // A nested node --test must not inherit the outer runner's IPC mode.
  delete env.NODE_TEST_CONTEXT
  const result = spawnSync(process.execPath, ['--test', checker], {
    // Memory-constrained CI may spend >20s loading TypeScript. Keep bounded.
    cwd: dir,
    env,
    encoding: 'utf8',
    timeout: 120000,
  })
  assert.ifError(result.error)
  return result
}
function rejects(name, mutate, reason) {
  test(name, () =>
    fixture((context) => {
      mutate(context)
      const result = execute(context.dir)
      assert.notEqual(
        result.status,
        0,
        `Checker accepted mutation:\n${result.stdout}`,
      )
      assert.match(result.stdout + result.stderr, reason)
    }),
  )
}
test('unchanged copied checkout passes the standalone checker', () =>
  fixture(({ dir }) => {
    const result = execute(dir)
    assert.equal(result.status, 0, result.stdout + result.stderr)
  }))
rejects(
  'double-quoted Vue export requires a regular family README',
  ({ dir, edit }) => {
    edit(
      barrel,
      (s) =>
        s +
        '\nexport { default as NvMissing } from "./forms/Missing/NvMissing.vue"\n',
    )
    const target = path.join(dir, 'packages/ui/src/components/forms/Missing')
    fs.mkdirSync(target)
    fs.writeFileSync(
      path.join(target, 'NvMissing.vue'),
      '<template><div /></template>',
    )
  },
  /Missing.*README/,
)
for (const [name, change, reason] of [
  [
    'duplicate index row',
    (s) => s + '\n' + s.split('\n').find((line) => line.includes('[NvButton]')),
    /Duplicate.*NvButton/,
  ],
  [
    'stale index row',
    (s) =>
      s +
      '\n| [NvStale](packages/ui/src/components/forms/Button/README.md) | `forms/Button` |\n',
    /component inventory/,
  ],
  [
    'comment-only index row',
    (s) => s.replace(/^(.*\[NvButton\].*)$/m, '<!--\n$1\n-->'),
    /component inventory/,
  ],
  [
    'code-only index row',
    (s) => s.replace(/^(.*\[NvButton\].*)$/m, '```md\n$1\n```'),
    /component inventory/,
  ],
  [
    'wrong source family',
    (s) =>
      s.replace(/^(.*\[NvButton\].*\|)\s*`forms\/Button`/m, '$1 `forms/Input`'),
    /component inventory/,
  ],
])
  rejects(name, ({ edit }) => edit(doc, change), reason)
rejects(
  'unsupported star export fails closed',
  ({ edit }) => edit(barrel, (s) => s + '\nexport * from "./unknown"\n'),
  /Unsupported public export/,
)
rejects(
  'comment-only barrel export is not public',
  ({ edit }) =>
    edit(barrel, (s) =>
      s.replace(/^export \{ default as NvButton.*$/m, '// $&'),
    ),
  /component inventory/,
)
rejects(
  'README must be a regular file',
  ({ dir }) => {
    const target = path.join(
      dir,
      'packages/ui/src/components/forms/Button/README.md',
    )
    fs.unlinkSync(target)
    fs.mkdirSync(target)
  },
  /regular file/,
)
rejects(
  'Vue source must exist',
  ({ dir }) =>
    fs.unlinkSync(
      path.join(dir, 'packages/ui/src/components/forms/Button/NvButton.vue'),
    ),
  /regular file/,
)
rejects(
  'UI token adapter drift is independently rejected',
  ({ edit }) =>
    edit(adapter, () => "export { tokens } from '@packages/design-tokens'\n"),
  /UI token adapter contract/,
)
for (const expression of [
  'undefined',
  'NaN',
  'Infinity',
  '() => 1',
  'Symbol("bad")',
  '{}',
]) {
  rejects(
    `unsafe or empty theme branch: ${expression}`,
    ({ edit }) => {
      for (const mode of ['light', 'dark'])
        edit(`packages/ui/src/themes/${mode}.ts`, (s) =>
          s.replace(/(backdropOpacity: )0\.95/, `$1${expression}`),
        )
      edit(doc, (s) =>
        s
          .split('\n')
          .filter(
            (line) => !line.includes('theme.card.transparent.backdropOpacity'),
          )
          .join('\n'),
      )
    },
    /JSON-safe|Empty object branch/,
  )
}
rejects(
  'new exported size helper requires documentation',
  ({ edit }) =>
    edit(
      helpers,
      (s) =>
        s +
        '\nexport function marginStyleBySize(size: Size) { return { margin: "1rem" } }\n',
    ),
  /helpers.marginStyleBySize/,
)
rejects(
  'exported Size function alias requires documentation',
  ({ edit }) =>
    edit(
      helpers,
      (s) => s + '\nexport const paddingAlias = paddingStyleBySize\n',
    ),
  /helpers.paddingAlias/,
)
rejects(
  'source size domain cannot shrink with its documentation',
  ({ edit }) => {
    edit(helpers, (s) =>
      s.replace("['xs', 'sm', 'md', 'lg']", "['xs', 'sm', 'md']"),
    )
    edit(doc, (s) =>
      s
        .split('\n')
        .filter((line) => !/helpers\..*\.lg/.test(line))
        .join('\n'),
    )
  },
  /size domain/,
)
test('loader rejects an existing escaped path', () =>
  fixture(({ dir, edit }) => {
    const outside = path.join(dir, '..', path.basename(dir) + '-outside.ts')
    fs.writeFileSync(outside, 'export const probe = true')
    try {
      edit(
        checker,
        (s) =>
          s +
          `\ntest('escaped path', () => assert.throws(() => load(${JSON.stringify(
            '../' + path.basename(outside),
          )}), /trusted|containment/))\n`,
      )
      const result = execute(dir)
      assert.equal(result.status, 0, result.stdout + result.stderr)
    } finally {
      fs.unlinkSync(outside)
    }
  }))
rejects(
  'loader reports syntactic transpile diagnostics',
  ({ edit }) => edit(adapter, (s) => s + '\nconst broken = ;\n'),
  /TypeScript syntax/,
)
