import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, mkdtempSync, rmSync, readdirSync } from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { createRequire } from 'node:module'
import test from 'node:test'

const require = createRequire(import.meta.url)
const root = new URL('../', import.meta.url)

test('experimental SDK is the pinned complete upstream RC, distinct from legacy', () => {
  const app = JSON.parse(
    readFileSync(new URL('apps/app/package.json', root), 'utf8'),
  )
  assert.equal(
    app.dependencies['@packages/electron-game-overlay'],
    'workspace:*',
  )
  assert.equal(
    app.dependencies['electron-game-overlay'],
    'file:../../vendor/electron-game-overlay-0.1.0-rc.12.tgz',
  )
  const bytes = readFileSync(
    new URL('vendor/electron-game-overlay-0.1.0-rc.12.tgz', root),
  )
  assert.equal(
    createHash('sha256').update(bytes).digest('hex'),
    '10ecef4b7a46a870ea8cf5c1160321bf449712c5a93808e11a2a214051e708af',
  )
  const consumer = createRequire(new URL('apps/app/package.json', root))
  assert.equal(
    consumer('electron-game-overlay/package.json').version,
    '0.1.0-rc.12',
  )
  const sdkRoot = path.dirname(
    consumer.resolve('electron-game-overlay/package.json'),
  )
  const provenance = JSON.parse(
    readFileSync(path.join(sdkRoot, 'SDK_PROVENANCE.json'), 'utf8'),
  )
  assert.equal(provenance.version, '0.1.0-rc.12')
  assert.equal(
    provenance.baseCommit,
    'b89eeb6bf3efb94185e5041be582ac11df6342f6',
  )
  assert.equal(provenance.workingTreeDirty, true)
  for (const [entry, expected] of [
    [
      provenance.sourceSnapshot,
      'f1052a4877d6cd4e75f436d6ada6dfcb269cb1173ca7e23d752c22e1822c67ca',
    ],
    [
      provenance.sourceManifest,
      '289d7003ef386e2de166ed726df60e91bf88de4fcb201862d2b9e31a086968c1',
    ],
  ]) {
    assert.equal(entry.sha256, expected)
    assert.equal(
      createHash('sha256')
        .update(readFileSync(new URL(`vendor/${entry.file}`, root)))
        .digest('hex'),
      expected,
    )
  }
})

test('unpublished vendored RC has only an exact-version release-age exception', () => {
  const config = readFileSync(new URL('pnpm-workspace.yaml', root), 'utf8')
  const exemptions = config
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => /^- ['"]?electron-game-overlay(?:@|['"]?$)/.test(line))
  assert.deepEqual(exemptions, ['- electron-game-overlay@0.1.0-rc.12'])
  assert.doesNotMatch(config, /^  electron-game-overlay@.*: patches\//m)
  assert.doesNotMatch(config, /^minimumReleaseAge:\s*0\s*$/m)
})

test('both native architectures carry the fixed identity and verified artifacts', () => {
  const consumer = createRequire(new URL('apps/app/package.json', root))
  const sdk = path.dirname(
    consumer.resolve('electron-game-overlay/package.json'),
  )
  const runtime = path.join(sdk, 'dist/runtime/win32-x64/reshade')
  for (const bits of [64, 32]) {
    const suffix = bits === 64 ? '' : '32'
    const stamp = JSON.parse(
      readFileSync(
        path.join(runtime, `electron_game_overlay_runtime${suffix}.build.json`),
        'utf8',
      ).replace(/^\uFEFF/, ''),
    )
    assert.equal(stamp.addonBuildId, 'CCE20935ADD44EF6A5A7973014B2E07F')
    assert.equal(stamp.runtimeGeneration, 22)
    assert.equal(stamp.injectorFutureTargets, 2)
    assert.equal(stamp.cooperativeAddonProtocol, 1)
    assert.equal(stamp.addonPreloadProtocol, 1)
    const assets = {
      addonSha256: `electron_game_overlay.addon${bits}`,
      injectorSha256: `inject${suffix}.exe`,
      managerSha256: `electron_game_overlay_reshade_manager${suffix}.exe`,
      reshadeRuntimeSha256: `ReShade${bits}.dll`,
      reshadeBuildStampSha256: `ReShade${bits}.build.json`,
      reshadeConfigSha256: 'ReShade.ini',
    }
    for (const [field, file] of Object.entries(assets)) {
      const bytes = readFileSync(path.join(runtime, file))
      assert.equal(
        createHash('sha256').update(bytes).digest('hex'),
        stamp[field].toLowerCase(),
        file,
      )
      if (field === 'addonSha256')
        assert.ok(
          bytes.includes(Buffer.from(stamp.addonBuildId)),
          `${file}: compiled build identity`,
        )
    }
  }
})

test('Windows artifact builds exercise the experimental consumer inside packaged Electron', () => {
  const pkg = JSON.parse(readFileSync(new URL('package.json', root), 'utf8'))
  assert.equal(
    pkg.scripts['test:experimental-overlay:runtime'],
    'node tests/experimental-overlay-runtime.cjs',
  )
  const workflow = readFileSync(
    new URL('.github/workflows/build-artifact.yml', root),
    'utf8',
  )
  assert.ok(
    workflow.includes(
      'pnpm test:experimental-overlay:runtime apps/app/dist_electron/win-unpacked/resources/app.asar',
    ),
  )
})

test('afterPack preserves every actual SDK file including sealed dependency notices', async () => {
  const builder = require('../apps/app/electron-builder.config.js')
  assert.equal(typeof builder.afterPack, 'function')
  const temporary = mkdtempSync(path.join(os.tmpdir(), 'izabela-sdk-pack-'))
  try {
    const consumer = createRequire(new URL('apps/app/package.json', root))
    const sdk = path.dirname(
      consumer.resolve('electron-game-overlay/package.json'),
    )
    await builder.afterPack({
      electronPlatformName: 'win32',
      appOutDir: temporary,
    })
    const destination = path.join(
      temporary,
      'resources/app.asar.unpacked/node_modules/electron-game-overlay',
    )
    const files = readdirSync(sdk, { recursive: true, withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) =>
        path.relative(sdk, path.join(entry.parentPath, entry.name)),
      )
      .filter(
        (file) =>
          !file.startsWith(path.join('node_modules', '.bin') + path.sep),
      )
    assert.equal(files.length, 159)
    assert.deepEqual(
      readdirSync(destination, { recursive: true, withFileTypes: true })
        .filter((entry) => entry.isFile())
        .map((entry) =>
          path.relative(destination, path.join(entry.parentPath, entry.name)),
        )
        .sort(),
      [...files].sort(),
    )
    assert.ok(
      files.includes(
        path.join('dist', 'node_modules', 'tslib', 'CopyrightNotice.txt'),
      ),
    )
    for (const file of files)
      assert.deepEqual(
        readFileSync(path.join(destination, file)),
        readFileSync(path.join(sdk, file)),
        file,
      )
    const manifest = JSON.parse(
      readFileSync(
        path.join(destination, 'dist/overlay-manifest.json'),
        'utf8',
      ),
    )
    for (const file of manifest.files) {
      const bytes = readFileSync(path.join(destination, 'dist', file.path))
      assert.equal(
        createHash('sha256').update(bytes).digest('hex'),
        file.sha256,
        file.path,
      )
    }
    assert.equal(manifest.files.length, 154)
    const { verifyOverlayPackage } = consumer('electron-game-overlay/packaging')
    assert.deepEqual(await verifyOverlayPackage(destination), {
      sealedPayloads: 154,
    })
    // Exercise the physical ASAR-unpacked package's default source discovery.
    // Only the test registry is overridden; no build-account registration occurs.
    const installed = require(path.join(destination, 'dist/preload.js'))
    const storageRoot = path.join(temporary, 'isolated-preload-registry')
    const installation = await installed.registerOverlayAddonInstallation({
      applicationId: builder.appId,
      storageRoot,
    })
    assert.equal(installation.applicationId, 'com.nhs.izabela')
    for (const [cached, bits] of [
      [installation.addonPath, 64],
      [installation.x86AddonPath, 32],
    ])
      assert.deepEqual(
        readFileSync(cached),
        readFileSync(
          path.join(
            destination,
            `dist/runtime/win32-x64/reshade/electron_game_overlay.addon${bits}`,
          ),
        ),
      )
    await installed.unregisterOverlayAddonInstallation({
      applicationId: installation.applicationId,
      registrationId: installation.registrationId,
      storageRoot,
    })
    assert.equal(
      JSON.parse(
        readFileSync(path.join(storageRoot, 'registrations.json'), 'utf8'),
      ).registrations.length,
      0,
    )
  } finally {
    rmSync(temporary, { recursive: true, force: true })
  }
})

test('packaged experimental SDK remains outside ASAR for sealed engines and native executables', () => {
  const builder = require('../apps/app/electron-builder.config.js')
  assert.ok(
    builder.asarUnpack.includes('node_modules/electron-game-overlay/**/*'),
  )
  assert.ok(
    builder.asarUnpack.includes(
      'node_modules/@packages/electron-game-overlay/**/*',
    ),
  )
})
