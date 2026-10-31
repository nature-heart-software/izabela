// Loads Izabela's shipped main bundle, renderer and real SDK/native transport.
// The SDK wrappers below observe public calls; only the explicit negative
// control suppresses native focus. They never inject text or synthesize clicks.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { createRequire } = require('node:module')
const { spawn, execFileSync } = require('node:child_process')
const { app, BrowserWindow, nativeImage } = require('electron')
const config = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'))
process.argv = process.argv.slice(0, 2)
const requireApp = createRequire(path.join(config.appRoot, 'package.json'))
const sdk = requireApp('electron-game-overlay')
const evidence = {
  status: 'failed',
  case: config.case,
  negativeControl: config.negativeControl,
  electron: process.versions.electron,
  sdk: requireApp('electron-game-overlay/package.json').version,
  inputSource: 'Windows SendInput virtual-key down/up pairs',
  pointerActions: 0,
  realAppBundle: true,
  realRenderer: true,
  nativeInjectionExecuted: false,
  checks: [],
  diagnostics: [],
  keyTimings: [],
}
const failures = []
let target,
  overlay,
  wrapper,
  session,
  surface,
  intercepting = false,
  rendering = false
let targetConnected = false
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
  return image
}
async function verifyVisible(name, before) {
  await until(
    async () => {
      const state = await read()
      if (!state.rect?.width) return false
      const page = await overlay.webContents.capturePage()
      const size = page.getSize(),
        pixels = page.toBitmap()
      const frame = capture(name)
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
          const tx = Math.floor((x * frame.width) / state.width),
            ty = Math.floor((y * frame.height) / state.height)
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
            const tx = Math.floor((px * frame.width) / state.width),
              ty = Math.floor((py * frame.height) / state.height)
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
      window.addEventListener('blur', () => {
        held.clear()
        probe.held = []
      })
    }).catch((error) => failures.push(String(error)))
  })
})
const createSession = sdk.ElectronGameOverlay.prototype.createSession
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
  drive('shortcut', 13) // Actual configured Ctrl+Enter global shortcut.
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
async function run() {
  require(path.join(config.appRoot, 'dist-electron/background.js'))
  await app.whenReady()
  await until(
    async () =>
      overlay && wrapper && (await read()).probe && (await read()).value === '',
    'real messenger and public backend readiness',
    90000,
  )
  target = spawn(config.target, [], {
    cwd: path.dirname(config.target),
    windowsHide: false,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  evidence.targetPid = target.pid
  target.stdout.pipe(
    fs.createWriteStream(path.join(config.directory, 'target.stdout.log')),
  )
  target.stderr.pipe(
    fs.createWriteStream(path.join(config.directory, 'target.stderr.log')),
  )
  await until(
    () => {
      const module = drive('module').module
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
  evidence.nativeInjectionExecuted = true
  await until(
    () => targetConnected && surface,
    'authenticated graphics surface',
    30000,
  )
  drive('activate')
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
    await openAndType('b', 'ab', 'reopen')
    await verifyVisible('reopen', before)
    await wait(150) // Stabilize the game-side oracle only AFTER first-key checks.
    const gameKeys = Number(/ key=(\d+)/.exec(drive('state').title)?.[1])
    assert.ok(
      Number.isFinite(gameKeys),
      'SDK host input oracle must be enabled',
    )
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
    drive('key', 27)
    await until(
      () => !wrapper.visible && !intercepting,
      'second hide releases input',
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
  }
  const state = await read()
  assert.equal(state.probe.pointerDowns, 0)
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
    try {
      evidence.dom = await read()
      capture('failure')
    } catch {}
    console.error(evidence.error)
    await finish(1)
  })
