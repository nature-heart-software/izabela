import { generateExportsPlugin } from '..'
import type { Plugin } from 'vite'

const plugin = generateExportsPlugin({
  watch: false,
  entries: [
    {
      directories: [
        'src',
        ['components', { filename: 'index.ts', exportAll: true }],
      ],
      include: ['*.ts'],
      exclude: ['*.spec.ts'],
      omitSemi: true,
    },
  ],
})
const vitePlugin: Plugin = plugin
const name: string = plugin.name
const result: void = plugin.buildStart()
// @ts-expect-error configuration is required
generateExportsPlugin()
// @ts-expect-error entries must specify directories
generateExportsPlugin({ entries: [{ include: ['*.ts'] }] })
// @ts-expect-error watch must be boolean
generateExportsPlugin({ entries: [], watch: 'true' })
generateExportsPlugin({
  // @ts-expect-error directory overrides keep formatting types
  entries: [{ directories: [['src', { omitSemi: 1 }]] }],
})
// @ts-expect-error glob patterns must be strings
generateExportsPlugin({ entries: [{ directories: ['src'], include: [1] }] })
// @ts-expect-error no plugin teardown is exposed
plugin.closeBundle()
// @ts-expect-error buildStart does not expose asynchronous completion
const completed: Promise<void> = plugin.buildStart()
void [vitePlugin, name, result, completed]
