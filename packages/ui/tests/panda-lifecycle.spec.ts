import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'

const manifest = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
)

describe('Panda generation lifecycle', () => {
  it('does not build UI before workspace dependencies are built during installation', () => {
    for (const hook of ['preinstall', 'install', 'postinstall', 'prepare']) {
      expect(manifest.scripts[hook], hook).toBeUndefined()
    }
  })

  it('prepares generated styles at every supported UI entry point', () => {
    for (const script of [
      'build',
      'build:prod',
      'dev',
      'storybook',
      'build-storybook',
    ]) {
      expect(manifest.scripts[script], script).toMatch(
        /^pnpm run panda:prepare && /,
      )
    }
    expect(manifest.scripts['test:types']).toMatch(/^pnpm run build && /)
  })
})
