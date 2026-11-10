// Loads Izabela's shipped main bundle, renderer and real SDK/native transport.
// SDK calls stay real; security changes are blocked and preload storage is
// isolated. Only the explicit negative control suppresses native focus.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const Module = require('node:module')
const { createRequire } = Module
const { EventEmitter } = require('node:events')
const { PassThrough } = require('node:stream')
const childProcess = require('node:child_process')
const { spawn, execFileSync } = childProcess
const { app, BrowserWindow, nativeImage, screen, dialog } = require('electron')
const config = JSON.parse(fs.readFileSync(process.argv.at(-1), 'utf8'))
process.argv = [process.argv[0], __filename]
const requireApp = createRequire(path.join(config.appRoot, 'package.json'))
const sdk = requireApp('electron-game-overlay')
// Security configuration is always a controlled boundary in native E2E.
// The real button/IPC/main warning path runs, but no exclusion can be applied.
// Production bundles sudo-prompt into its main code rather than shipping a
// standalone module. Guard the OS shell boundary in both builds; loading a mock
// from the workspace would not intercept the bundled production implementation.
for (const method of [
  'exec',
  'execSync',
  'execFile',
  'execFileSync',
  'spawn',
  'spawnSync',
]) {
  const original = childProcess[method]
  childProcess[method] = function (command, ...args) {
    if (
      /(?:powershell|pwsh|cscript|wscript|runas)(?:\.exe)?\b/i.test(
        String(command),
      )
    ) {
      evidence.elevationRequests++
      throw new Error(
        'Elevation and security shell commands are forbidden in E2E',
      )
    }
    return original.call(this, command, ...args)
  }
}
dialog.showMessageBox = async () => {
  throw new Error(
    'The exclusion explanation must use the in-app dialog, not a native message box',
  )
}

const evidence = {
  status: 'failed',
  case: config.case,
  negativeControl: config.negativeControl,
  electron: process.versions.electron,
  sdk: requireApp('electron-game-overlay/package.json').version,
  scaleFactor: config.scaleFactor,
  targetMode: config.targetMode,
  startupDelayMs: config.startupDelayMs || 0,
  recovery: !!config.recovery,
  elevatedTrial: !!config.elevated,
  mediumTarget: !!config.mediumTarget,
  startupBarrier: config.targetMode !== 'fast-folder',
  inputSource: 'Windows SendInput virtual-key down/up pairs',
  pointerClicks: 0,
  realAppBundle: true,
  realRenderer: true,
  appIsPackaged: app.isPackaged,
  executable: process.execPath,
  nativeInjectionConfirmed: false,
  checks: [],
  diagnostics: [],
  keyTimings: [],
  managedEvents: [],
  policyUpdates: [],
  elevationRequests: 0,
}
// Override only the app bundle's public SDK imports. Production omits addonDirectory;
// the E2E setup and launcher both use this owned registry instead of the account's.
const preloadAddonDirectory =
  config.addonDirectory ||
  path.join(
    config.directory,
    'isolated-addon-registry',
    // The nightly uses shorter shared-directory filenames. Keep the long-path
    // regression deliberate instead of depending on its previous cache layout.
    'long-path-regression-' + 'x'.repeat(64),
  )
const preload = requireApp('electron-game-overlay/preload')
const loadModule = Module._load
const applicationBundle = path.join(config.appRoot, 'dist-electron') + path.sep
Module._load = function (request, parent, isMain) {
  if (parent?.filename?.startsWith(applicationBundle)) {
    if (request === 'electron-game-overlay')
      return {
        ...sdk,
        createReShadeLaunchConfig(options) {
          assert.ok(options.addonPreload?.applicationId)
          assert.equal(options.addonPreload.addonDirectory, undefined)
          assert.equal(options.addonPreload.storageRoot, undefined)
          evidence.preloadRuntimeApplicationId =
            options.addonPreload.applicationId
          return sdk.createReShadeLaunchConfig({
            ...options,
            // Test profiles isolate application state, while the SDK's sealed
            // payload store is reused across sequential graphics cells/builds.
            runsRootDirectory:
              config.runtimeRunsRoot || options.runsRootDirectory,
            addonPreload: {
              ...options.addonPreload,
              addonDirectory: preloadAddonDirectory,
            },
          })
        },
      }
    if (request === 'electron-game-overlay/preload')
      return {
        ...preload,
        async registerOverlayAddonInstallation(options) {
          assert.equal(options.addonDirectory, undefined)
          assert.equal(options.storageRoot, undefined)
          assert.equal(options.packageRoot, undefined)
          const result = await preload.registerOverlayAddonInstallation({
            ...options,
            addonDirectory: preloadAddonDirectory,
          })
          evidence.preloadRegistration = {
            applicationId: result.applicationId,
            registrationId: result.registrationId,
            isolated: true,
            directory: preloadAddonDirectory,
          }
          return result
        },
        unregisterOverlayAddonInstallation(options) {
          return preload.unregisterOverlayAddonInstallation({
            ...options,
            addonDirectory: preloadAddonDirectory,
          })
        },
      }
  }
  return loadModule.call(this, request, parent, isMain)
}
const failures = []
const databaseRepository = requireApp('./package.json')
  .repository.split('/')
  .slice(-2)
  .join('/')
const databaseUrls = new Map(
  ['allowlist', 'denylist'].map((kind) => [
    `https://raw.githubusercontent.com/${databaseRepository}/refs/heads/dev/databases/game-overlay-${kind}.json`,
    kind,
  ]),
)
const controlledSessions = new WeakSet()
let target,
  managedController,
  overlay,
  wrapper,
  session,
  surface,
  intercepting = false,
  rendering = false
let targetConnected = false
let fatalWatcherError
let targetOperationError
let failureOwner
let failurePrefix
let refusal
let delayedOwner
const progress = setInterval(() => {
  fs.writeFileSync(
    path.join(config.directory, 'progress.json'),
    JSON.stringify(
      {
        ...evidence,
        wrapper: wrapper && { id: wrapper.id, name: wrapper.name },
        windows: BrowserWindow.getAllWindows().map((window) => ({
          id: window.id,
          url: window.webContents.getURL(),
        })),
      },
      null,
      2,
    ),
  )
}, 1000)
progress.unref()
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
async function until(check, label, timeout = 20000) {
  const deadline = Date.now() + timeout
  while (Date.now() < deadline) {
    if (fatalWatcherError) throw fatalWatcherError
    if (targetOperationError) throw targetOperationError
    const result = await check()
    if (result) return result
    await wait(10)
  }
  throw new Error(`Timed out: ${label}`)
}
const evaluate = (fn) =>
  overlay.webContents.executeJavaScript(`(${fn.toString()})()`)
const read = () =>
  evaluate(() => {
    const input = document.querySelector(
      '[data-v-step="messenger-text-input"] input, input[data-v-step="messenger-text-input"], [data-v-step="messenger-text-input"] textarea',
    )
    const rect = input?.getBoundingClientRect()
    let lastGlyph
    if (input?.value) {
      const style = getComputedStyle(input)
      const context = document.createElement('canvas').getContext('2d')
      context.font = style.font
      const prefix = context.measureText(input.value.slice(0, -1)).width
      lastGlyph = {
        x:
          rect.x +
          parseFloat(style.paddingLeft) +
          parseFloat(style.borderLeftWidth) +
          prefix -
          input.scrollLeft,
        width: context.measureText(input.value).width - prefix,
      }
    }
    return {
      value: input?.value,
      focused: document.activeElement === input,
      rect: rect && {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
      },
      width: innerWidth,
      height: innerHeight,
      lastGlyph,
      probe: window.__overlayNativeE2E,
    }
  })
function drive(command, value) {
  return JSON.parse(
    execFileSync(
      config.input,
      [
        String(target.pid),
        config.target,
        command,
        ...(value === undefined ? [] : [String(value)]),
      ],
      { windowsHide: true, encoding: 'utf8', timeout: 10000 },
    ),
  )
}
function bitmap(filename) {
  const bytes = fs.readFileSync(filename)
  assert.equal(bytes.readUInt16LE(0), 0x4d42)
  const width = bytes.readInt32LE(18),
    height = bytes.readInt32LE(22)
  assert.ok(width > 0 && height < 0, 'top-down 32-bit fixture capture required')
  const pixels = bytes.subarray(bytes.readUInt32LE(10))
  return {
    width,
    height: -height,
    pixels,
    at(x, y) {
      return [...pixels.subarray((y * width + x) * 4, (y * width + x) * 4 + 3)]
    },
  }
}
function capture(name) {
  const filename = path.join(config.directory, `${name}.bmp`)
  drive('capture', filename)
  const image = bitmap(filename)
  fs.writeFileSync(
    path.join(config.directory, `${name}.png`),
    nativeImage
      .createFromBitmap(image.pixels, {
        width: image.width,
        height: image.height,
      })
      .toPNG(),
  )
  fs.unlinkSync(filename) // PNG retains the same capture; avoid raw bitmap copies.
  return image
}
async function verifyVisible(name, before) {
  await until(
    async () => {
      const state = await read()
      if (!state.rect?.width) return false
      // NativeImage.getSize() is DIP on modern Electron. Read the real raster
      // dimensions from the existing PNG representation, without resampling.
      const png = (await overlay.webContents.capturePage()).toPNG()
      const size = { width: png.readUInt32BE(16), height: png.readUInt32BE(20) }
      const pixels = nativeImage.createFromBuffer(png).toBitmap()
      assert.equal(pixels.length, size.width * size.height * 4)
      const frame = capture(name)
      const bounds = wrapper.getBounds()
      evidence.rasterGeometry = {
        bounds,
        contentBounds: overlay.getContentBounds(),
        surface,
        viewport: { width: state.width, height: state.height },
        raster: size,
        target: { width: frame.width, height: frame.height },
        scale: config.scaleFactor,
      }
      let matched = 0
      for (const fx of [0.2, 0.5, 0.8])
        for (const fy of [0.25, 0.5, 0.75]) {
          const x = state.rect.x + state.rect.width * fx,
            y = state.rect.y + state.rect.height * fy
          const source =
            (Math.floor((y * size.height) / state.height) * size.width +
              Math.floor((x * size.width) / state.width)) *
            4
          const expected = [...pixels.subarray(source, source + 3)]
          const tx = Math.floor(x * config.scaleFactor),
            ty = Math.floor(y * config.scaleFactor)
          if (pixels[source + 3] < 250 || expected.some((v) => v < 180))
            continue
          const actual = frame.at(tx, ty),
            prior = before.at(tx, ty)
          if (
            actual.every((v, i) => Math.abs(v - expected[i]) < 45) &&
            prior.some((v, i) => Math.abs(v - expected[i]) > 70)
          )
            matched++
        }
      let ink = 0,
        matchedInk = 0,
        minX = Infinity,
        maxX = -Infinity
      // Require the newly typed final glyph to reach the actual graphics window.
      // A frozen compositor frame or an old caret must not satisfy the DOM check.
      if (state.lastGlyph)
        for (let x = 0; x < Math.ceil(state.lastGlyph.width); x++) {
          for (let y = 3; y < state.rect.height - 3; y++) {
            const px = state.lastGlyph.x + x,
              py = state.rect.y + y
            const source =
              (Math.floor((py * size.height) / state.height) * size.width +
                Math.floor((px * size.width) / state.width)) *
              4
            if (
              pixels[source + 3] < 250 ||
              Math.max(...pixels.subarray(source, source + 3)) > 140
            )
              continue
            ink++
            minX = Math.min(minX, x)
            maxX = Math.max(maxX, x)
            const tx = Math.floor(px * config.scaleFactor),
              ty = Math.floor(py * config.scaleFactor)
            let found = false
            for (let dx = -1; dx <= 1; dx++)
              for (let dy = -1; dy <= 1; dy++)
                if (Math.max(...frame.at(tx + dx, ty + dy)) < 165) found = true
            if (found) matchedInk++
          }
        }
      evidence.renderedInputSamples = matched
      evidence.renderedTextSamples = {
        value: state.value,
        ink,
        matchedInk,
        inkWidth: maxX - minX,
      }
      return (
        matched >= 3 && ink >= 8 && maxX - minX >= 2 && matchedInk / ink >= 0.9
      )
    },
    'actual target pixels contain the messenger input',
    7000,
  )
  evidence.checks.push(
    `${name}: messenger pixels visible in owned graphics window`,
  )
}
app.setName(`Izabela native overlay E2E ${process.pid}`)
app.setPath('userData', config.profile)
app.setPath('sessionData', path.join(config.profile, 'session'))
app.setLoginItemSettings = () => {} // Do not change the user's login registration.
process.on('uncaughtException', (error) =>
  failures.push(String(error.stack || error)),
)
process.on('unhandledRejection', (error) =>
  failures.push(String(error?.stack || error)),
)
app.on('browser-window-created', (_event, window) => {
  const browserSession = window.webContents.session
  if (!controlledSessions.has(browserSession)) {
    controlledSessions.add(browserSession)
    browserSession.protocol.handle('https', (request) => {
      const kind = databaseUrls.get(request.url)
      if (!kind)
        return browserSession.fetch(request, {
          bypassCustomProtocolHandlers: true,
        })
      evidence.controlledDatabaseRequests ??= []
      evidence.controlledDatabaseRequests.push(kind)
      // Keep real fetch/store/IPC/policy revision handling, with owned test data.
      // Published database rules must never authorize unrelated workstation apps.
      return new Response(
        JSON.stringify(
          kind === 'allowlist' ? [config.target.replaceAll('\\', '/')] : [],
        ),
        {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        },
      )
    })
  }
  window.webContents.on('render-process-gone', (_e, details) =>
    failures.push(details.reason),
  )
  window.webContents.on('did-finish-load', () => {
    if (!window.webContents.getURL().includes('experimental-game-overlay'))
      return
    overlay = window
    window.webContents.setAudioMuted(true)
    void evaluate(() => {
      const probe = (window.__overlayNativeE2E = {
        pointerDowns: 0,
        held: [],
        keys: [],
        wheels: [],
      })
      const held = new Set()
      document.addEventListener('pointerdown', () => probe.pointerDowns++)
      document.addEventListener('keydown', (event) => {
        held.add(event.key)
        probe.held = [...held]
        probe.keys.push({ key: event.key, trusted: event.isTrusted })
      })
      document.addEventListener('keyup', (event) => {
        held.delete(event.key)
        probe.held = [...held]
      })
      document.addEventListener('wheel', (event) => {
        probe.wheels.push({ trusted: event.isTrusted, deltaY: event.deltaY })
      })
      window.addEventListener('blur', () => {
        held.clear()
        probe.held = []
      })
    }).catch((error) => failures.push(String(error)))
  })
})
const createSession = sdk.ElectronGameOverlay.prototype.createSession
const onTargetEvent = sdk.OverlayTargetWatcher.prototype.onEvent
sdk.OverlayTargetWatcher.prototype.onEvent = function (handler) {
  managedController = this
  void this.ready.then(
    () => {
      evidence.initialDiscoveryReady = true
    },
    (error) => {
      evidence.initialDiscoveryError = String(error)
    },
  )
  return onTargetEvent.call(this, (event) => {
    evidence.managedEvents.push({
      type: event.type,
      at: Date.now(),
      pid: event.target?.pid,
      mode: event.target?.mode,
      creationTime100ns: event.identity?.creationTime100ns,
      targetCreationTime100ns: event.target?.identity?.creationTime100ns,
      failureCode: event.error?.diagnostic?.code,
      failureStage: event.error?.diagnostic?.stage,
      windowsErrorCode: event.error?.diagnostic?.windowsErrorCode,
      injectorEvidence: event.error?.diagnostic?.evidence,
      retrySafety: event.error?.diagnostic?.retrySafety,
      scoped: !!(event.target || event.selector),
      error:
        event.type === 'error'
          ? String(event.error?.stack || event.error)
          : undefined,
    })
    if (event.type === 'error' && !event.target && !event.selector)
      fatalWatcherError = event.error
    if (
      event.type === 'error' &&
      event.target &&
      target &&
      event.target.pid === target.pid
    )
      targetOperationError = event.error
    return handler(event)
  })
}
const updatePolicy = sdk.OverlayTargetWatcher.prototype.update
sdk.OverlayTargetWatcher.prototype.update = function (policy) {
  const entry = {
    allow: policy.earlyPolicy?.allow,
    deny: policy.earlyPolicy?.deny,
    status: 'pending',
    eventsAtStart: evidence.managedEvents.length,
  }
  evidence.policyUpdates.push(entry)
  let result
  try {
    result = updatePolicy.call(this, policy)
  } catch (error) {
    entry.status = 'failed'
    entry.error = String(error)
    throw error
  }
  void result.then(
    () => {
      entry.status = 'applied'
    },
    (error) => {
      entry.status = 'failed'
      entry.error = String(error)
    },
  )
  return result
}
const prepare = sdk.ReShadeOverlayLauncher.prototype.prepare
sdk.ReShadeOverlayLauncher.prototype.prepare = function (...args) {
  const ready = prepare.apply(this, args)
  void ready.then(
    () => {
      evidence.launcherPrepared = true
    },
    (error) => {
      evidence.launcherPrepareError = String(error.stack || error)
    },
  )
  return ready
}
sdk.ElectronGameOverlay.prototype.createSession = function (...args) {
  evidence.sessionObserved = true
  const result = createSession.apply(this, args)
  session = result
  for (const method of ['intercept', 'release']) {
    const original = result.input[method].bind(result.input)
    result.input[method] = (...parameters) => {
      evidence.inputRequests ??= []
      evidence.inputRequests.push({ method, at: Date.now() })
      return original(...parameters)
    }
  }
  const whenReady = result.whenReady.bind(result)
  result.whenReady = () => {
    const ready = whenReady()
    void ready.then(
      () => {
        evidence.sessionReady = true
      },
      (error) => {
        evidence.sessionReadyError = String(error.stack || error)
      },
    )
    return ready
  }
  result.on('targetConnected', (event) => {
    if (event.pid === target?.pid) targetConnected = true
  })
  result.on('targetSurfaceChanged', (event) => {
    if (event.pid === target?.pid) surface = event
  })
  result.on('inputInterceptionChanged', (event) => {
    if (event.pid === target?.pid) intercepting = event.intercepting
  })
  result.on('diagnostic', (event) => {
    evidence.diagnostics.push({ code: event.code, pid: event.pid })
    if (
      event.pid === target?.pid &&
      event.code === 'runtime-scene-rendering-started'
    )
      rendering = true
  })
  const attach = result.windows.attach.bind(result.windows)
  result.windows.attach = (...parameters) => {
    const window = attach(...parameters)
    evidence.attachedWindow = { id: window.id, name: window.name }
    if (
      window.name === 'messenger-game-overlay' ||
      parameters[1]?.id === 'messenger-game-overlay'
    ) {
      wrapper = window
      if (config.negativeControl)
        window.focus = () => window.browserWindow.focusOnWebView()
    }
    return window
  }
  return result
}
async function openAndType(key, expected, label) {
  const started = Date.now()
  evidence.shortcutState = drive('shortcut', 13) // Actual configured Ctrl+Enter global shortcut.
  await until(
    () => wrapper.visible && intercepting,
    `${label}: overlay input interception`,
  )
  const submitted = Date.now()
  drive('key', key.charCodeAt(0) - 32)
  evidence.keyTimings.push({ label, openToKeyMs: submitted - started })
  // No focus-owner wait, arbitrary grace period, DOM click or input insertion.
  if (config.negativeControl) {
    await wait(700)
    const state = await read()
    assert.equal(
      state.focused,
      true,
      'Negative control must retain real DOM focus',
    )
    assert.ok(
      wrapper.visible && intercepting && rendering,
      'Negative control must have a rendered, interactive overlay',
    )
    assert.equal(
      state.value,
      '',
      'Broken native focus must drop the first OS key',
    )
    evidence.checks.push(
      'negative control: rc.1-style webview-only focus drops first key',
    )
  } else {
    await until(
      async () => {
        const s = await read()
        return s.value === expected && !s.probe.held.includes(key)
      },
      `${label}: first character ${expected}`,
      5000,
    )
    const state = await read()
    assert.equal(state.probe.pointerDowns, 0)
    assert.ok(
      state.probe.keys.some((event) => event.key === key && event.trusted),
    )
    evidence.checks.push(
      `${label}: first OS key registered without a pointer-down`,
    )
  }
}
async function pointerAt(
  selector,
  elementExpression = `document.querySelector(${JSON.stringify(selector)})`,
) {
  const point = await overlay.webContents.executeJavaScript(`(() => {
    const element = ${elementExpression}
    if (!element) return null
    const r = element.getBoundingClientRect()
    const x = r.x + r.width / 2, y = r.y + r.height / 2
    const hit = document.elementFromPoint(x, y)
    return r.width && r.height && hit && (element === hit || element.contains(hit))
      ? { x, y, width: innerWidth, height: innerHeight, cssCursor: getComputedStyle(hit).cursor } : null
  })()`)
  assert.ok(point, `Visible pointer target: ${selector}`)
  drive(
    'move',
    `${Math.round(point.x * config.scaleFactor)},${Math.round(
      point.y * config.scaleFactor,
    )}`,
  )
  return point
}
async function verifyPointerAndScroll() {
  const input =
    '[data-v-step="messenger-text-input"] input, input[data-v-step="messenger-text-input"], [data-v-step="messenger-text-input"] textarea'
  // Complete both no-click first-key assertions before any pointer interaction.
  assert.equal((await read()).probe.pointerDowns, 0)
  const gameWheel = Number(/ wheel=(\d+)/.exec(drive('state').title)?.[1])
  assert.ok(Number.isFinite(gameWheel), 'Native wheel oracle is enabled')
  for (const [selector, expected] of [
    [input, 'text'],
    ['[data-v-step="settings-button"]', 'pointer'],
  ]) {
    const point = await pointerAt(selector)
    assert.equal(point.cssCursor, expected)
    await until(
      () => drive('state').cursor === expected,
      `actual Windows ${expected} cursor`,
      5000,
    )
    evidence.checks.push(
      `hover: real ${expected} cursor over actual messenger control`,
    )
  }
  drive('click')
  evidence.pointerClicks++
  const scroller = '#settings .settings__content'
  // Locate the actual overflow region by behavior, independent of generated
  // Panda class names or the previous Tailwind utility.
  const scrollElement = `Array.from(document.querySelectorAll('${scroller}, ${scroller} *'))
    .find(e => /^(auto|scroll)$/.test(getComputedStyle(e).overflowY)
      && e.clientHeight >= 40 && e.scrollHeight > e.clientHeight + 100)`
  const scrollState = () =>
    overlay.webContents.executeJavaScript(`(() => {
    const e = ${scrollElement}
    if (!e || e.clientHeight < 40 || e.scrollHeight <= e.clientHeight + 100) return null
    const r = e.getBoundingClientRect()
    return { top: e.scrollTop, height: e.clientHeight, content: e.scrollHeight,
      x: r.x, y: r.y, width: r.width }
  })()`)
  const initial = await until(
    scrollState,
    'real settings overflow panel',
    10000,
  )
  await pointerAt(scroller, scrollElement)
  await until(
    async () => (await read()).probe.pointerDowns === evidence.pointerClicks,
    'native settings click reached renderer',
  )
  drive('wheel', -120)
  const down = await until(
    async () => {
      const value = await scrollState()
      return value?.top > initial.top + 5 && value
    },
    'native wheel scrolls real settings content',
    5000,
  )
  drive('wheel', 120)
  await until(
    async () => (await scrollState())?.top < down.top - 5,
    'reverse native settings scroll',
    5000,
  )
  assert.ok(
    (await read()).probe.wheels.some(
      (event) => event.trusted && event.deltaY !== 0,
    ),
  )
  await wait(150)
  assert.equal(
    Number(/ wheel=(\d+)/.exec(drive('state').title)?.[1]),
    gameWheel,
    'Intercepted wheel must not leak into the game',
  )
  evidence.settingsScroll = { initial, down }
  evidence.checks.push(
    'native pointer click opens settings; trusted wheel scrolls actual panel in both directions',
  )
  capture('settings-scrolled')
  await pointerAt('[data-v-step="settings-button"]')
  drive('click')
  evidence.pointerClicks++
  await until(
    () =>
      overlay.webContents.executeJavaScript(
        "!document.querySelector('#settings')",
      ),
    'settings popup closes',
  )
  await pointerAt(input)
  drive('click')
  evidence.pointerClicks++
  await until(
    async () => (await read()).focused,
    'real input refocused after pointer tests',
  )
}
async function verifyDefenderWarning() {
  drive('shortcut', 13)
  await until(
    () => wrapper.visible && intercepting,
    'overlay reopened for security-button cancellation test',
  )
  await pointerAt('[data-v-step="settings-button"]')
  drive('click')
  evidence.pointerClicks++
  await until(
    () =>
      overlay.webContents.executeJavaScript(
        "!!document.querySelector('#settings')",
      ),
    'settings popup opened',
  )
  await pointerAt('a[href="#/settings/game-overlay"]')
  drive('click')
  evidence.pointerClicks++
  await until(
    () =>
      overlay.webContents.executeJavaScript(
        "!!document.querySelector('[data-overlay-defender-exclusions]')",
      ),
    'experimental Defender action visible',
  )
  await pointerAt('[data-overlay-defender-exclusions]')
  capture('defender-action')
  drive('click')
  evidence.pointerClicks++
  await until(
    () =>
      overlay.webContents.executeJavaScript(
        "!!document.querySelector('[data-overlay-defender-dialog]')",
      ),
    'in-app Defender explanation is visible',
  )
  const explanation = await overlay.webContents.executeJavaScript(
    "document.querySelector('[data-overlay-defender-dialog]').textContent",
  )
  assert.ok(
    explanation.includes('may be flagged as malware') &&
      explanation.includes('exclusion list'),
  )
  assert.ok(
    wrapper.visible && intercepting,
    'dialog remains within the visible interactive app',
  )
  await pointerAt('[data-overlay-defender-cancel]')
  drive('click')
  evidence.pointerClicks++
  await until(
    async () =>
      !(await overlay.webContents.executeJavaScript(
        "!!document.querySelector('[data-overlay-defender-dialog]')",
      )),
    'in-app cancellation closes the explanation',
  )
  assert.equal(evidence.elevationRequests, 0)
  evidence.checks.push(
    'in-app Defender dialog stays visible; Cancel leaves security settings untouched',
  )
}
async function changePolicy(patch) {
  const previous = evidence.policyUpdates.length
  await overlay.webContents.executeJavaScript(`(() => {
    const store = document.querySelector('#app').__vue_app__.config.globalProperties.$pinia._s.get('game-overlay');
    if (!store) throw new Error('Real game-overlay Pinia store unavailable');
    store.$patch(${JSON.stringify(patch)});
  })()`)
  await until(
    () =>
      evidence.policyUpdates.length > previous &&
      evidence.policyUpdates.at(-1).status !== 'pending',
    'real renderer policy change reached managed SDK',
  )
  assert.equal(
    evidence.policyUpdates.at(-1).status,
    'applied',
    JSON.stringify(evidence.policyUpdates.at(-1)),
  )
}
async function removeRedundantRule() {
  const folder = path.dirname(config.target).replaceAll('\\', '/') + '/**'
  const name = '**/' + path.basename(config.target)
  await changePolicy({ allowlist: [folder, name] })
  await changePolicy({ allowlist: [folder] })
  assert.ok(
    managedController.targets.some((t) => t.pid === target.pid && !t.cancelled),
    'Authorized running target survives removal',
  )
  assert.equal(wrapper.visible, true)
  assert.equal(intercepting, true)
}
async function revokePolicy(before) {
  if (config.targetMode === 'fast-folder') {
    const previousPid = target.pid
    const pointerDowns = (await read()).probe.pointerDowns
    await closeTarget()
    await until(
      () =>
        evidence.managedEvents.some(
          (event) =>
            event.type === 'exited' &&
            event.pid === previousPid &&
            event.creationTime100ns,
        ),
      'folder-policy target authoritative exit after rule removal',
    )
    await until(
      () =>
        evidence.managedEvents
          .slice(evidence.policyUpdates.at(-1).eventsAtStart)
          .some((event) => event.type === 'armed'),
      'updated folder policy has an armed successor for relaunch',
    )
    await startTarget()
    assert.notEqual(target.pid, previousPid)
    const baseline = capture('folder-relaunch-before')
    drive('shortcut', 13)
    await until(
      () => wrapper.visible && intercepting,
      'folder relaunch overlay interception',
    )
    drive('key', 68)
    await until(
      async () => (await read()).value === 'abcd',
      'folder relaunch first native key without clicking',
    )
    assert.equal((await read()).probe.pointerDowns, pointerDowns)
    await verifyVisible('folder-relaunch', baseline)
    drive('key', 8)
    await until(
      async () => (await read()).value === 'abc',
      'folder relaunch test key cleared',
    )
    drive('key', 27)
    await until(
      () => !wrapper.visible && !intercepting,
      'folder relaunch Escape releases input',
    )
    evidence.checks.push(
      'folder-only policy after basename removal: fresh no-barrier relaunch renders and accepts first key without clicking',
    )
  }
  if (!wrapper.visible) drive('shortcut', 13)
  await until(
    () => wrapper.visible && intercepting,
    'overlay opened before genuine revocation',
  )
  const state = await read()
  await changePolicy({ denylist: [config.target.replaceAll('\\', '/')] })
  evidence.revocation = {
    lastInterceptionAck: intercepting,
    cancelled: managedController.targets.some(
      (t) => t.pid === target.pid && t.cancelled,
    ),
  }
  await until(() => !wrapper.visible, 'genuine deny hides application overlay')
  const x = Math.floor(
    (state.rect.x + state.rect.width / 2) * config.scaleFactor,
  )
  const y = Math.floor(
    (state.rect.y + state.rect.height / 2) * config.scaleFactor,
  )
  await until(
    () =>
      capture('revoked')
        .at(x, y)
        .every((v, i) => Math.abs(v - before.at(x, y)[i]) < 15),
    'revocation removes actual overlay pixels',
  )
  const keys = Number(/ key=(\d+)/.exec(drive('state').title)?.[1])
  drive('key', 86)
  await until(
    () => Number(/ key=(\d+)/.exec(drive('state').title)?.[1]) > keys,
    'revoked target receives OS key',
  )
  evidence.revocation.nativeKeyReturnedToGame = true
  assert.equal((await read()).value, 'abc')
  evidence.checks.push(
    'genuine deny revokes actual overlay pixels and input; game receives native key',
  )
}
async function startTarget() {
  await until(() => {
    const latest = evidence.policyUpdates.at(-1)
    if (latest?.status === 'failed') throw new Error(latest.error)
    if (!evidence.initialDiscoveryReady || latest?.status === 'pending')
      return false
    const current = evidence.managedEvents.slice(latest?.eventsAtStart ?? 0)
    const ready = current.findLastIndex((event) => event.type === 'ready')
    const blocked = current.findLastIndex(
      (event) => event.type === 'discovery-blocked',
    )
    return ready >= 0 && ready > blocked
  }, 'current managed discovery ready after latest policy update')
  evidence.targetLaunchReadiness ??= []
  evidence.targetLaunchReadiness.push({
    at: Date.now(),
    updatesSettled: evidence.policyUpdates.length,
    eventsObserved: evidence.managedEvents.length,
  })
  targetConnected = false
  targetOperationError = undefined
  surface = undefined
  rendering = false
  intercepting = false
  if (config.targetMode !== 'fast-folder')
    fs.writeFileSync(
      path.join(
        path.dirname(config.target),
        'electron-game-overlay-startup-barrier.enabled',
      ),
      '',
    )
  else
    assert.equal(
      fs.existsSync(
        path.join(
          path.dirname(config.target),
          'electron-game-overlay-startup-barrier.enabled',
        ),
      ),
      false,
    )
  if (config.mediumTarget) {
    const prefix = path.join(config.directory, 'medium-target')
    fs.writeFileSync(prefix + '.start', '')
    await until(() => {
      if (fs.existsSync(prefix + '.error.json'))
        throw new Error(fs.readFileSync(prefix + '.error.json', 'utf8'))
      return fs.existsSync(prefix + '.started.json')
    }, 'medium owner creates the checksum-pinned graphics target')
    const identity = JSON.parse(
      fs.readFileSync(prefix + '.started.json', 'utf8'),
    )
    assert.equal(
      identity.executablePath.toLowerCase(),
      config.target.toLowerCase(),
    )
    const proxy = new EventEmitter()
    Object.assign(proxy, {
      pid: identity.pid,
      exitCode: null,
      stdout: new PassThrough(),
      stderr: new PassThrough(),
      kill: () => fs.writeFileSync(prefix + '.stop', ''),
    })
    const observeExit = setInterval(() => {
      if (!fs.existsSync(prefix + '.exited.json')) return
      const exited = JSON.parse(
        fs.readFileSync(prefix + '.exited.json', 'utf8'),
      )
      proxy.exitCode = exited.exitCode ?? 1
      clearInterval(observeExit)
      proxy.stdout.end()
      proxy.stderr.end()
      proxy.emit('exit', proxy.exitCode)
    }, 25)
    observeExit.unref()
    target = proxy
    evidence.mediumTargetIdentity = identity
    evidence.mediumOwnerContext = config.mediumOwnerContext
  } else if (config.startupDelayMs) {
    const prefix = path.join(
      config.directory,
      'delayed-start-' + evidence.targetLaunchReadiness.length,
    )
    const owned = (delayedOwner = spawn(
      config.recoveryOwner,
      [
        '--graphics',
        config.target,
        config.fixtureSource,
        prefix,
        String(config.startupDelayMs),
      ],
      {
        cwd: path.dirname(config.target),
        windowsHide: true,
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    ))
    let ownerError
    owned.once('error', (error) => {
      ownerError = error
    })
    await until(() => {
      if (ownerError) throw ownerError
      if (fs.existsSync(prefix + '.json')) return true
      if (owned.exitCode !== null)
        throw new Error('Delayed fixture owner exited: ' + owned.exitCode)
      return false
    }, 'owned suspended graphics target creation')
    const identity = JSON.parse(fs.readFileSync(prefix + '.json', 'utf8'))
    const proxy = new EventEmitter()
    Object.assign(proxy, {
      pid: identity.pid,
      exitCode: null,
      stdout: owned.stdout,
      stderr: owned.stderr,
      kill: () => owned.kill(),
    })
    owned.once('exit', (code) => {
      proxy.exitCode = code ?? 1
      proxy.emit('exit', code)
    })
    target = proxy
    evidence.delayedStarts ??= []
    evidence.delayedStarts.push({
      ...identity,
      prefix,
      requestedMs: config.startupDelayMs,
    })
  } else {
    target = spawn(config.target, [], {
      cwd: path.dirname(config.target),
      windowsHide: false,
      stdio: ['ignore', 'pipe', 'pipe'],
    })
  }
  evidence.targetPid = target.pid
  const token = drive('token')
  assert.equal(token.pid, target.pid)
  assert.equal(token.elevated, !!config.elevated && !config.mediumTarget)
  assert.equal(
    token.integrityRid,
    config.elevated && !config.mediumTarget ? 12288 : 8192,
  )
  assert.equal(token.sessionId, evidence.consumerExecutionContext.sessionId)
  if (config.mediumTarget)
    assert.equal(
      token.creationTime100ns,
      evidence.mediumTargetIdentity.creationTime100ns,
    )
  evidence.targetTokens ??= []
  evidence.targetTokens.push(token)
  target.stdout.pipe(
    fs.createWriteStream(path.join(config.directory, 'target.stdout.log')),
  )
  target.stderr.pipe(
    fs.createWriteStream(path.join(config.directory, 'target.stderr.log')),
  )
  if (config.targetMode !== 'fast-folder') {
    await until(
      () => {
        const inspection = drive('module')
        evidence.moduleInspection = inspection
        const module = inspection.module
        if (!module) return false
        const log = path.join(path.dirname(module), 'inject.stdout.log')
        return (
          fs.existsSync(log) &&
          fs
            .readFileSync(log, 'utf8')
            .includes('ELECTRON_GAME_OVERLAY_INJECTOR_RESULT')
        )
      },
      'completed injection before releasing controlled graphics barrier',
      45000,
    )
    fs.unlinkSync(
      path.join(
        path.dirname(config.target),
        'electron-game-overlay-startup-barrier.enabled',
      ),
    )
  }
  await until(
    () =>
      targetConnected &&
      surface &&
      evidence.managedEvents.some(
        (event) => event.type === 'connected' && event.pid === target.pid,
      ),
    'authenticated graphics surface',
    30000,
  )
  evidence.nativeInjectionConfirmed = true
  if (config.startupDelayMs) {
    const delayed = evidence.delayedStarts.at(-1)
    delayed.resumedAfterMs = Number(
      fs.readFileSync(delayed.prefix + '.resumed', 'utf8'),
    )
    assert.ok(
      delayed.resumedAfterMs >= config.startupDelayMs,
      'Only the fixture owner resumes its target after the requested delay',
    )
    assert.ok(
      evidence.managedEvents.some(
        (event) =>
          event.type === 'attaching' &&
          event.pid === delayed.pid &&
          event.targetCreationTime100ns === delayed.creationTime100ns,
      ),
      'SDK attachment uses the exact delayed target incarnation',
    )
    const module = drive('module').module
    assert.ok(module, 'Delayed target has the actual injected module')
    const nativeLog = fs.readFileSync(
      path.join(path.dirname(module), 'inject.stdout.log'),
      'utf8',
    )
    const prefix = 'EGO_TARGET_STARTUP_READINESS_V1 '
    const records = nativeLog
      .split(/\r?\n/)
      .filter((line) => line.startsWith(prefix))
    assert.equal(records.length, 1, 'One native startup readiness observation')
    const readiness = JSON.parse(records[0].slice(prefix.length))
    assert.equal(readiness.pid, delayed.pid)
    assert.equal(
      readiness.waited,
      true,
      'Fixture must exercise the actual SDK wait',
    )
    assert.equal(readiness.loaderState, 'initialized')
    assert.equal(readiness.windowsError, 0)
    assert.ok(readiness.attempts > 1)
    delayed.readiness = readiness
    evidence.checks.push(
      'SDK waits through delayed loader startup before normal graphics attachment',
    )
  }
  const inspection = drive('module')
  assert.equal(inspection.queryError, 0, 'Owned module inspection succeeds')
  assert.ok(inspection.module, 'Owned ReShade module is present')
  if (config.elevated) {
    const prefix = 'EGO_TARGET_AUTHORIZATION_V1 '
    const log = fs.readFileSync(
      path.join(path.dirname(inspection.module), 'inject.stdout.log'),
      'utf8',
    )
    const records = log
      .split(/\r?\n/)
      .filter((line) => line.startsWith(prefix))
      .map((line) => JSON.parse(line.slice(prefix.length)))
    const authorization = records.find((entry) => entry.pid === target.pid)
    assert.ok(
      authorization,
      'Native elevated authorization is observed for the exact target',
    )
    assert.equal(authorization.targetHandlePid, target.pid)
    assert.equal(authorization.phase, 'allowed-private-elevated')
    assert.equal(authorization.windowsError, 0)
    assert.equal(authorization.injector.elevated, true)
    assert.equal(authorization.target.elevated, !config.mediumTarget)
    evidence.elevatedAuthorizations ??= []
    evidence.elevatedAuthorizations.push(authorization)
    evidence.elevatedPrivatePayloads ??= []
    evidence.elevatedPrivatePayloads.push({
      pid: target.pid,
      files: fs
        .readdirSync(path.dirname(inspection.module), { withFileTypes: true })
        .filter(
          (entry) =>
            entry.isFile() &&
            /(?:\.exe|\.dll|\.addon32|\.addon64)$/i.test(entry.name),
        )
        .map((entry) => path.join(path.dirname(inspection.module), entry.name)),
    })
  }
  // The high lane deliberately avoids the shared long-path registration.
  if (
    !config.elevated &&
    config.profile.startsWith(config.directory + path.sep)
  )
    assert.ok(
      inspection.maxModulePathLength > 260,
      'Default test profile exercises a loaded module beyond MAX_PATH',
    )
  evidence.targetModuleInspections ??= []
  evidence.targetModuleInspections.push({ pid: target.pid, ...inspection })
  drive('activate')
}
async function closeTarget() {
  const owned = target
  if (!owned || owned.exitCode !== null) return
  drive('close')
  await until(() => owned.exitCode !== null, 'owned graphics host exited', 5000)
}
async function closeObservedTarget() {
  const pid = target.pid
  await closeTarget()
  await until(
    () =>
      evidence.managedEvents.some(
        (event) =>
          event.type === 'exited' &&
          event.pid === pid &&
          event.creationTime100ns,
      ),
    'SDK confirms the exact graphics process exited',
  )
}
async function stopFailureTarget() {
  if (!failureOwner) return
  const owned = failureOwner
  fs.writeFileSync(failurePrefix + '.stop', '')
  await until(
    () => owned.exitCode !== null,
    'retained-handle fixture owner exited',
    10000,
  )
  assert.equal(owned.exitCode, 0)
  assert.ok(fs.existsSync(failurePrefix + '.exited'))
  failureOwner = undefined
}
async function failOwnedTarget(mode) {
  const prefix = (failurePrefix = path.join(
    config.directory,
    'failure-' + mode,
  ))
  const begin = evidence.managedEvents.length
  failureOwner = spawn(
    config.recoveryOwner,
    ['--own', config.failureTarget, prefix, mode],
    { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] },
  )
  failureOwner.stderr.pipe(fs.createWriteStream(prefix + '.stderr.log'))
  await until(
    () => fs.existsSync(prefix + '.json'),
    'owned failure target creation',
  )
  const identity = JSON.parse(fs.readFileSync(prefix + '.json', 'utf8'))
  const expectedCode =
    mode === 'suspended'
      ? 'target-startup-readiness-failed'
      : 'runtime-initialization-timeout'
  const failed = await until(
    () =>
      evidence.managedEvents
        .slice(begin)
        .find((event) => event.type === 'error' && event.pid === identity.pid),
    'owned target produces the real expected SDK failure',
    35000,
  )
  assert.equal(failed.scoped, true, 'Failure remains scoped to B')
  assert.equal(failed.failureCode, expectedCode)
  if (mode === 'suspended') assert.equal(failed.windowsErrorCode, 1460)
  assert.equal(failed.targetCreationTime100ns, identity.creationTime100ns)
  assert.equal(
    failed.retrySafety,
    mode === 'suspended' ? 'definite-safe' : 'indeterminate',
  )
  await stopFailureTarget()
  await until(
    () =>
      evidence.managedEvents
        .slice(begin)
        .some(
          (event) =>
            event.type === 'exited' &&
            event.pid === identity.pid &&
            event.creationTime100ns === identity.creationTime100ns,
        ),
    'SDK retires B only after authoritative process-instance exit',
  )
  evidence.recoveryFailures ??= []
  evidence.recoveryFailures.push({
    mode,
    ...identity,
    code: failed.failureCode,
  })
}
async function startAccessRefusal() {
  const child = spawn(config.refusalOwner, [], {
    cwd: path.dirname(config.refusalOwner),
    windowsHide: true,
    stdio: ['pipe', 'pipe', 'pipe'],
  })
  const owned = (refusal = { child, records: [], buffer: '' })
  child.on('error', (error) => {
    owned.error = error
  })
  child.once('exit', (code, signal) => {
    owned.exit = { code, signal }
  })
  child.stdout.on('data', (bytes) => {
    owned.buffer += bytes.toString()
    let newline
    while ((newline = owned.buffer.indexOf('\n')) >= 0) {
      const line = owned.buffer.slice(0, newline).trim()
      owned.buffer = owned.buffer.slice(newline + 1)
      if (line) owned.records.push(JSON.parse(line))
    }
  })
  child.stderr.pipe(
    fs.createWriteStream(
      path.join(config.directory, 'access-refusal.stderr.log'),
    ),
  )
  const ready = await until(() => {
    if (owned.error) throw owned.error
    if (owned.exit)
      throw new Error(
        `Access-refusal fixture exited before readiness: ${JSON.stringify(owned.exit)}`,
      )
    return owned.records.find((record) => record.ready)
  }, 'SDK-owned access refusal fixture ready')
  assert.equal(ready.kind, 'EGO_OWNED_ACCESS_REFUSAL_V1')
  assert.equal(ready.readOnlyIdentityVerified, true)
  assert.equal(ready.fullAccessWindowsError, 5)
  assert.equal(
    ready.executablePath.toLowerCase(),
    config.refusedTarget.toLowerCase(),
  )
  owned.identity = ready
  const failed = await until(
    () =>
      evidence.managedEvents.find(
        (event) => event.type === 'error' && event.pid === ready.pid,
      ),
    'refused full-access open remains target-scoped',
  )
  assert.equal(failed.targetCreationTime100ns, ready.creationTime100ns)
  assert.equal(failed.scoped, true)
  assert.equal(failed.failureCode, 'injector-failed')
  assert.equal(
    child.exitCode,
    null,
    'Refused B remains alive while fresh A starts',
  )
  evidence.recoveryFailures ??= []
  evidence.recoveryFailures.push({
    mode: 'access-refusal',
    pid: ready.pid,
    creationTime100ns: ready.creationTime100ns,
    code: failed.failureCode,
  })
}
async function stopAccessRefusal() {
  if (!refusal) return
  const owned = refusal
  owned.child.stdin.end('exit\n')
  await until(
    () =>
      owned.child.exitCode !== null &&
      owned.records.some((record) => record.exited),
    'SDK refusal owner authoritative cleanup',
  )
  assert.equal(owned.child.exitCode, 0)
  const exited = owned.records.find((record) => record.exited)
  assert.ok(exited?.retainedHandle)
  assert.equal(exited.pid, owned.identity.pid)
  assert.equal(exited.creationTime100ns, owned.identity.creationTime100ns)
  await until(
    () =>
      evidence.managedEvents.some(
        (event) =>
          event.type === 'exited' &&
          event.pid === exited.pid &&
          event.creationTime100ns === exited.creationTime100ns,
      ),
    'SDK confirms refused target exit',
  )
  assert.equal(
    evidence.managedEvents.filter(
      (event) => event.type === 'attaching' && event.pid === exited.pid,
    ).length,
    1,
    'No reinjection or repeated attempt into refused live B',
  )
  evidence.accessRefusal = { identity: owned.identity, exit: exited }
  refusal = undefined
}
async function verifyMixedRecovery() {
  for (const mode of ['access-refusal', 'suspended', 'timeout']) {
    await closeObservedTarget()
    if (mode === 'access-refusal') await startAccessRefusal()
    else await failOwnedTarget(mode)
    await startTarget()
    const before = capture('recovery-' + mode + '-before')
    const previous = (await read()).value
    await openAndType('d', previous + 'd', 'fresh-A-after-' + mode)
    await until(() => rendering, 'recovered target renders the overlay')
    await verifyVisible('recovery-' + mode, before)
    if (mode === 'access-refusal') {
      await stopAccessRefusal()
      assert.ok(wrapper.visible && intercepting, 'B exit preserves A input')
      drive('key', 69)
      await until(
        async () => (await read()).value === previous + 'de',
        'A keeps typing after refused B exits',
      )
      drive('key', 8)
    }
    drive('key', 8)
    await until(
      async () => (await read()).value === previous,
      'clear recovery key',
    )
    drive('key', 27)
    await until(
      () => !wrapper.visible && !intercepting,
      'recovered target releases input',
    )
    evidence.checks.push(
      `fresh A after B ${mode} failure renders and types without a click`,
    )
  }
}
async function run() {
  if (config.appExecutable) {
    assert.equal(app.isPackaged, true, 'Real executable runs in packaged mode')
    assert.equal(
      process.execPath.toLowerCase(),
      config.appExecutable.toLowerCase(),
    )
  }
  require(path.join(config.appRoot, 'dist-electron/background.js'))
  await app.whenReady()
  evidence.consumerExecutionContext =
    await sdk.inspectOverlayConsumerExecutionContext()
  await until(
    async () =>
      overlay && wrapper && (await read()).probe && (await read()).value === '',
    'real messenger and public backend readiness',
    90000,
  )
  if (!config.elevated)
    assert.equal(
      evidence.consumerExecutionContext?.overlaySupported,
      true,
      'The normal-permission graphics test must be supported by the SDK',
    )
  assert.equal(evidence.consumerExecutionContext.elevated, !!config.elevated)
  if (config.elevated)
    assert.equal(evidence.consumerExecutionContext.integrityRid, 12288)
  evidence.savedRunAsAdmin = await overlay.webContents.executeJavaScript(
    "document.querySelector('#app').__vue_app__.config.globalProperties.$pinia._s.get('settings').runAsAdmin",
  )
  assert.equal(
    evidence.savedRunAsAdmin,
    !!config.elevated,
    'Izabela must preserve the saved administrator-startup preference',
  )
  evidence.displayScaleFactor = screen.getPrimaryDisplay().scaleFactor
  assert.equal(evidence.displayScaleFactor, config.scaleFactor)
  // Startup updates still run while the SDK prepares. Only the controlled game
  // launch waits for the real database snapshots and their current discovery.
  await until(
    () =>
      overlay.webContents.executeJavaScript(`(() => {
      const store = document.querySelector('#app').__vue_app__.config.globalProperties.$pinia._s.get('databases');
      return ['game-overlay-allowlist', 'game-overlay-denylist'].every(name => Array.isArray(store?.data[name]));
    })()`),
    'real initial database policy snapshots received',
  )
  await startTarget()
  assert.deepEqual([...new Set(evidence.controlledDatabaseRequests)].sort(), [
    'allowlist',
    'denylist',
  ])
  drive('move', '20,20')
  await wait(100)
  const gameCursor = drive('state').cursor
  const before = capture('before-open')
  await openAndType('a', 'a', 'first-show')
  if (!config.negativeControl) {
    await until(() => rendering, 'native overlay scene rendered')
    await verifyVisible('first-show', before)
    drive('key', 27) // Real Escape -> renderer -> normal stop-interception IPC.
    await until(
      () => !wrapper.visible && !intercepting,
      'Escape hides overlay and releases interception',
    )
    assert.equal((await read()).value, 'a')
    if (config.recovery) await verifyMixedRecovery()
    if (config.targetMode === 'early') {
      const previousPid = target.pid
      const selection = evidence.managedEvents.findIndex(
        (event) => event.type === 'attaching' && event.pid === previousPid,
      )
      await closeTarget()
      await until(
        () =>
          evidence.managedEvents.some(
            (event) =>
              event.type === 'exited' &&
              event.pid === previousPid &&
              event.creationTime100ns,
          ),
        'SDK authoritative process-incarnation exit',
      )
      await until(
        () =>
          evidence.managedEvents
            .slice(selection + 1)
            .some((event) => event.type === 'armed'),
        'SDK successor watcher armed before the next launch',
      )
      await startTarget()
      assert.notEqual(target.pid, previousPid)
      assert.equal(
        evidence.managedEvents.filter(
          (event) => event.type === 'connected' && event.mode === 'early',
        ).length,
        2,
      )
      evidence.checks.push(
        'managed early attachment: two fresh game launches, authoritative exit, rearm and no best-effort fallback',
      )
    }
    await openAndType('b', 'ab', 'reopen')
    await verifyVisible('reopen', before)
    await wait(150) // Stabilize the game-side oracle only AFTER first-key checks.
    const gameKeys = Number(/ key=(\d+)/.exec(drive('state').title)?.[1])
    assert.ok(
      Number.isFinite(gameKeys),
      'SDK host input oracle must be enabled',
    )
    if (
      config.case === 'd3d11-x64' &&
      config.scaleFactor === 1 &&
      config.targetMode !== 'early'
    )
      await removeRedundantRule()
    drive('key', 67)
    await until(
      async () => (await read()).value === 'abc',
      'ordinary native typing',
    )
    await wait(150)
    assert.equal(
      Number(/ key=(\d+)/.exec(drive('state').title)?.[1]),
      gameKeys,
      'Intercepted typing must not leak into the game',
    )
    if (
      config.case === 'd3d11-x64' &&
      config.scaleFactor === 1 &&
      config.targetMode !== 'early'
    ) {
      await verifyVisible('policy-removal', before)
      evidence.checks.push(
        'redundant basename allow removal retains real native typing and rendered overlay',
      )
    }
    await verifyPointerAndScroll()
    drive('key', 27)
    await until(
      () => !wrapper.visible && !intercepting,
      'second hide releases input',
    )
    drive('move', '20,20')
    await until(
      () => drive('state').cursor === gameCursor,
      'hidden overlay restores native game cursor',
      5000,
    )
    evidence.checks.push(
      'hiding restores the game cursor after overlay pointer use',
    )
    const gameWheel = Number(/ wheel=(\d+)/.exec(drive('state').title)?.[1])
    drive('wheel', -120)
    await until(
      () => Number(/ wheel=(\d+)/.exec(drive('state').title)?.[1]) > gameWheel,
      'hidden overlay releases wheel input to graphics host',
      5000,
    )
    evidence.checks.push(
      'intercepted wheel is isolated; hiding returns wheel input to the game',
    )
    drive('key', 90)
    await until(
      () => Number(/ key=(\d+)/.exec(drive('state').title)?.[1]) > gameKeys,
      'hidden overlay returns keyboard input to graphics host',
    )
    assert.equal((await read()).value, 'abc')
    evidence.checks.push(
      'hidden overlay releases input to the game; intercepted typing does not leak',
    )
    if (
      config.case === 'd3d11-x64' &&
      config.scaleFactor === 1 &&
      config.targetMode === 'folder'
    )
      await verifyDefenderWarning()
    if (
      config.case === 'd3d11-x64' &&
      config.scaleFactor === 1 &&
      config.targetMode !== 'early'
    )
      await revokePolicy(before)
  }
  const state = await read()
  assert.ok(
    !evidence.managedEvents.some((event) => event.type === 'discovery-blocked'),
    'Future discovery must remain usable throughout the test',
  )
  assert.ok(
    !evidence.managedEvents.some(
      (event) =>
        event.type === 'error' &&
        !evidence.recoveryFailures?.some(
          (failure) => failure.pid === event.pid,
        ),
    ),
    'Only the explicitly owned failure fixtures may report target errors',
  )
  assert.ok(
    evidence.preloadRegistration?.isolated,
    'Preload setup uses the test registry',
  )
  assert.equal(
    evidence.preloadRegistration.applicationId,
    evidence.preloadRuntimeApplicationId,
  )
  evidence.checks.push(
    'installed add-on setup and existing launcher share the stable identity and isolated registry',
  )
  assert.equal(
    evidence.elevationRequests,
    0,
    'Native E2E must never request administrator changes',
  )
  assert.equal(state.probe.pointerDowns, evidence.pointerClicks)
  evidence.dom = state
  assert.deepEqual(failures, [], 'No uncaught application errors')
  evidence.status = 'passed'
}
const deadline = setTimeout(() => {
  evidence.error = 'Native E2E deadline exceeded'
  finish(1)
}, 150000)
let finishing = false
async function finish(code) {
  if (finishing) return
  finishing = true
  clearTimeout(deadline)
  clearInterval(progress)
  if (refusal) {
    try {
      refusal.child.stdin.end('exit\n')
      await Promise.race([
        new Promise((resolve) => refusal.child.once('exit', resolve)),
        wait(5000),
      ])
      if (refusal.child.exitCode === null) refusal.child.kill()
    } catch {}
  }
  if (failureOwner) {
    try {
      fs.writeFileSync(failurePrefix + '.stop', '')
      await Promise.race([
        new Promise((resolve) => failureOwner.once('exit', resolve)),
        wait(5000),
      ])
      if (failureOwner.exitCode === null) failureOwner.kill()
    } catch {}
  }
  evidence.windows = BrowserWindow.getAllWindows().map((window) => ({
    id: window.id,
    url: window.webContents.getURL(),
  }))
  if (target && target.exitCode === null) {
    try {
      drive('close')
    } catch {}
    await Promise.race([
      new Promise((resolve) => target.once('exit', resolve)),
      wait(2500),
    ])
    if (target.exitCode === null) target.kill()
  }
  if (delayedOwner && delayedOwner.exitCode === null) {
    delayedOwner.kill()
    await Promise.race([
      new Promise((resolve) => delayedOwner.once('exit', resolve)),
      wait(2000),
    ])
  }
  if (target) {
    const identity = evidence.managedEvents.findLast(
      (event) => event.type === 'attaching' && event.pid === target.pid,
    )?.targetCreationTime100ns
    const observed = () =>
      evidence.managedEvents.some(
        (event) =>
          event.type === 'exited' &&
          event.pid === target.pid &&
          event.creationTime100ns === identity,
      )
    const untilExit = Date.now() + 5000
    while (identity && !observed() && Date.now() < untilExit) await wait(20)
    evidence.cleanupTargetExitObserved = !!identity && observed()
    // Let retirement finish while the app still owns its launcher and guards.
    // Closing the OS window alone is not the SDK's authoritative exit signal.
    const inspected = evidence.targetModuleInspections?.findLast(
      (entry) => entry.pid === target.pid,
    )
    if (inspected?.module && evidence.cleanupTargetExitObserved) {
      const images = [32, 64].map((bits) =>
        path.join(
          path.dirname(inspected.module),
          `electron_game_overlay.addon${bits}`,
        ),
      )
      const untilRetired = Date.now() + 5000
      while (
        images.some((file) => fs.existsSync(file)) &&
        Date.now() < untilRetired
      )
        await wait(20)
      evidence.cleanupPrivateImagesRetired = images.every(
        (file) => !fs.existsSync(file),
      )
      if (config.elevated) {
        const files =
          evidence.elevatedPrivatePayloads?.flatMap((entry) => entry.files) ||
          []
        const deadline = Date.now() + 5000
        while (
          files.some((file) => fs.existsSync(file)) &&
          Date.now() < deadline
        )
          await wait(20)
        evidence.cleanupPrivateCodeRetired =
          files.length > 0 && files.every((file) => !fs.existsSync(file))
      }
    }
    if (
      code === 0 &&
      (!evidence.cleanupTargetExitObserved ||
        !evidence.cleanupPrivateImagesRetired ||
        (config.elevated && !evidence.cleanupPrivateCodeRetired))
    ) {
      code = 1
      evidence.status = 'failed'
      evidence.error =
        'Test cleanup did not observe authoritative target exit and private image retirement'
    }
  }
  fs.writeFileSync(
    path.join(config.directory, 'report.json'),
    JSON.stringify(evidence, null, 2) + '\n',
  )
  app.quit()
  setTimeout(() => app.exit(code), 800).unref()
}
run()
  .then(() => finish(0))
  .catch(async (error) => {
    evidence.error = String(error.stack || error)
    evidence.finalInputState = {
      visible: wrapper?.visible,
      intercepting,
      rendering,
      targetConnected,
    }
    try {
      evidence.dom = await read()
      capture('failure')
    } catch {}
    console.error(evidence.error)
    await finish(1)
  })
