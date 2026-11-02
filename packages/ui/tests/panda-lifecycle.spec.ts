import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'

const manifest = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
)

describe('Panda generation lifecycle', () => {
  it('does not require a legacy utility compiler or its configuration', () => {
    const rootManifest = JSON.parse(
      readFileSync(new URL('../../../package.json', import.meta.url), 'utf8'),
    )
    expect(rootManifest.dependencies.tailwindcss).toBeUndefined()
    expect(rootManifest.devDependencies.tailwindcss).toBeUndefined()
    expect(
      existsSync(
        new URL('../../../apps/app/tailwind.config.js', import.meta.url),
      ),
    ).toBe(false)
    expect(existsSync(new URL('../tailwind.config.cjs', import.meta.url))).toBe(
      false,
    )
  })
  it('prepares the app runtime before development, build and type checking', () => {
    const appManifest = JSON.parse(
      readFileSync(
        new URL('../../../apps/app/package.json', import.meta.url),
        'utf8',
      ),
    )
    for (const script of ['dev', 'build', 'build:prod', 'lint']) {
      expect(appManifest.scripts[script]).toMatch(/^pnpm run panda:prepare && /)
    }
  })
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
