import { createRequire } from 'node:module'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'

// Panda's PostCSS builder holds one config per process, as in each Vite build.
const packageRoot = resolve(process.argv[2])
const output = resolve(process.argv[3])
const require = createRequire(resolve(packageRoot, 'package.json'))
const postcss = require('postcss')
const config = require(resolve(
  packageRoot,
  existsSync(resolve(packageRoot, 'postcss.config.cjs'))
    ? 'postcss.config.cjs'
    : 'postcss.config.js',
))
const from = resolve(packageRoot, 'src/styles/panda.css')
const result = await postcss(config.plugins).process(
  readFileSync(from, 'utf8'),
  { from },
)
mkdirSync(dirname(output), { recursive: true })
writeFileSync(
  output,
  JSON.stringify({
    css: result.css,
    hasWatchDependencies: result.messages.some(
      (message) => message.type === 'dir-dependency',
    ),
  }),
)
