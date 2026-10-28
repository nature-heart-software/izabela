import {
  generateExports,
  type Entry,
  type Options,
  type DirectoriesOption,
} from '..'

const options: Options = {
  include: ['*.ts'],
  exclude: ['*.spec.ts'],
  singleQuote: false,
  exportAllAsAlias: true,
}
const paths: DirectoriesOption = {
  directories: ['src', ['components', { filename: 'index.ts' }]],
}
const entry: Entry = { ...options, ...paths }
const generator = generateExports({
  entries: [entry, { directories: ['empty'] }],
  watch: false,
})
const name: string = generator.name
const started: void = generator.start()
// @ts-expect-error watching is a boolean
generateExports({ entries: [entry], watch: 'yes' })
// @ts-expect-error directory configuration is required
generateExports({ entries: [{ include: ['*.ts'] }] })
// @ts-expect-error include patterns must be strings
generateExports({ entries: [{ directories: ['src'], include: [1] }] })
// @ts-expect-error directory overrides use the same option types
generateExports({ entries: [{ directories: [['src', { omitSemi: 'yes' }]] }] })
// @ts-expect-error entries must be an array
generateExports({ entries: entry })
// @ts-expect-error the public start contract is fire-and-forget, not awaitable completion
const completion: Promise<void> = generator.start()
// @ts-expect-error watcher teardown is not exposed by the current runtime
generator.stop()
// @ts-expect-error fully specified Options require include patterns
const invalidOptions: Options = { filename: 'index.ts' }
void [name, started, completion, invalidOptions]
