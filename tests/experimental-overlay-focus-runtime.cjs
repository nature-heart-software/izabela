// Genuine Electron + RC SDK wrapper + compiled application focus regression.
// Only service/style/speech-control boundaries are controlled; not DOM focus.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { createHash } = require('node:crypto')

module.exports = async function focusRuntime({ sdkRoot, profile }) {
  const { BrowserWindow, session } = require('electron')
  const { parse, compileScript } = require('@vue/compiler-sfc')
  const ts = require('typescript')
  const { rollup } = require('rollup')
  const { nodeResolve } = require('@rollup/plugin-node-resolve')
  const evidencePath = path.resolve('coverage/experimental-overlay/focus.json')
  const report = {
    status: 'failed',
    stage: 'compile',
    platform: process.platform,
    electronVersion: process.versions.electron,
    nativeInjectionExecuted: false,
    sdkTransportExecuted: false,
    controlledBoundaries: [
      'RC internal createElectronOverlayWindow factory with inert compositor bridge; public session attach/create NOT called',
      'messenger/settings/speech/database/game-overlay/profile stores and IPC/socket services',
      'style/theme/layout/background/debug components; NvMessenger composition replaced with actual InputBar',
      'NvSpeechEngineInput exposes a real DOM input and Vue v-model; no speech providers',
    ],
    genuine: [
      'RC SDK window show/hide/focus/blur',
      'Electron offscreen BrowserWindow and char events',
      'Vue client renderer, VueUse event listeners, compiler-sfc, TypeScript',
      'actual App.vue, InputBar.vue and immutable URL consts',
    ],
    exclusions: [
      'game/native injection',
      'SDK transport',
      'full application E2E',
      'real speech controls/providers',
      'physical OS keyboard/mouse',
    ],
    sources: {},
    samples: [],
  }
  fs.mkdirSync(path.dirname(evidencePath), { recursive: true })
  const save = () =>
    fs.writeFileSync(evidencePath, JSON.stringify(report, null, 2))
  save()
  let window, sdkWindow, bundle, failure
  const rendererErrors = []
  const partition = `focus-${process.pid}`
  const browserSession = session.fromPartition(partition)
  const unexpectedRequests = []
  browserSession.webRequest.onBeforeRequest((details, callback) => {
    const permitted =
      details.url.startsWith('file:') || details.url === 'about:blank'
    if (!permitted) unexpectedRequests.push(details.url.split(':')[0])
    callback({ cancel: !permitted })
  })
  async function bounded(promise, label, milliseconds = 7000) {
    let timer
    try {
      return await Promise.race([
        promise,
        new Promise((_, reject) => {
          timer = setTimeout(
            () => reject(new Error(`${label} deadline exceeded`)),
            milliseconds,
          )
        }),
      ])
    } finally {
      clearTimeout(timer)
    }
  }
  try {
    assert.match(process.versions.electron, /^46\./)
    const root = path.resolve('apps/app/src')
    const modules = new Map()
    function source(relative) {
      const filename = path.join(root, relative)
      const text = fs.readFileSync(filename, 'utf8')
      report.sources[relative] = createHash('sha256').update(text).digest('hex')
      return { filename, text }
    }
    function sfc(id, relative) {
      const { filename, text } = source(relative)
      const { descriptor, errors } = parse(text, { filename })
      assert.deepEqual(errors, [])
      const compiled = compileScript(descriptor, { id, inlineTemplate: true })
      modules.set(
        id,
        ts.transpileModule(compiled.content, {
          compilerOptions: {
            target: ts.ScriptTarget.ES2022,
            module: ts.ModuleKind.ESNext,
          },
        }).outputText,
      )
    }
    sfc('actual-app', 'teams/messenger/App.vue')
    sfc('actual-bar', 'teams/messenger/components/NvMessengerInputBar.vue')
    modules.set('@/consts.ts', source('consts.ts').text)
    modules.set(
      'controlled',
      `
      import { reactive, ref, h, defineComponent } from 'vue';
      export const events = [];
      export const store = reactive({ isFocused: false, isShown: true,
        focusContext: 'keyboard', position: {}, $patch(v) { Object.assign(this, v) } });
      export const settings = reactive({ theme: 'test', runAsAdmin: true,
        clearMessageOnWindowHide: false, messageMode: 'message' });
      export const layout = { setup(_, { slots }) { return () => h('div', slots.default?.()) } };
      export const speechInput = defineComponent({
        inheritAttrs: false, props: ['modelValue'], emits: ['update:modelValue', 'focus', 'blur'],
        setup(props, { expose, emit }) {
          const input = ref(); expose({ input });
          return () => h('input', { id: 'actual-speech-boundary-input', ref: input,
            value: props.modelValue, onInput: e => emit('update:modelValue', e.target.value),
            onFocus: () => emit('focus'), onBlur: () => emit('blur') });
        }
      });
    `,
    )
    const stubs = {
      '@packages/ui': `export { layout as NvButton, layout as NvCard, layout as NvGroup, layout as GlobalStyles } from 'controlled'; export const tokens = {}; export const themes = new Map([['test', {}]]); export const PORTAL_TARGET = 'portal';`,
      'vue3-styled-components': `export { layout as ThemeProvider } from 'controlled';`,
      '@/teams/messenger/components/NvMessenger.vue': `export { default } from 'actual-bar';`,
      '@/teams/messenger/components/NvBackground.vue': `export { layout as default } from 'controlled';`,
      '@/teams/messenger/components/NvDebug.vue': `export { layout as default } from 'controlled';`,
      '@/features/speech/components/inputs/NvSpeechEngineInput.vue': `export { speechInput as default } from 'controlled';`,
      '@/teams/messenger/store': `import { store } from 'controlled'; export const useMessengerStore = () => store; export const useMessengerWindowStore = () => store;`,
      '@/features/settings/store': `import { settings } from 'controlled'; export const useSettingsStore = () => settings;`,
      '@/features/speech/store': `export const useSpeechStore = () => ({ commands: [] });`,
      '@/services': `import { events } from 'controlled'; export const socket = { emit: (...args) => events.push(args) };`,
      '@/features/databases/store': `export const useDatabasesStore = () => ({ $whenReady: async () => {}, databases: [] });`,
      '@/features/game-overlay/store': `export const useGameOverlayStore = () => ({});`,
      '@/features/profiles/store.ts': `export const useProfilesStore = () => ({});`,
      '@/electron/events/renderer': `export function emitIPCGameOverlayStopIntercept() {} export function emitIPCSay() {}`,
      '@/electron/events/renderer.ts': `export function onIPCApplyProfile() {}`,
      '@root/package.json': `export default { repository: 'controlled/repository' };`,
      'lodash/takeRight': `export default (a, n) => a.slice(-n);`,
    }
    for (const [id, text] of Object.entries(stubs)) modules.set(id, text)
    modules.set(
      'entry',
      `
      import { createApp, nextTick } from 'vue';
      import App from 'actual-app';
      import { events } from 'controlled';
      const refuse = () => { throw new Error('Unexpected renderer service/native/network call') };
      window.fetch = refuse; window.XMLHttpRequest = refuse; window.WebSocket = refuse;
      window.ElectronMessengerWindow = { hide: refuse, zoomIn: refuse, zoomOut: refuse, resetZoom: refuse };
      window.__focusProbe = { clicks: 0, events, errors: [], ready: false };
      document.addEventListener('click', () => window.__focusProbe.clicks++);
      const app = createApp(App);
      app.config.errorHandler = e => window.__focusProbe.errors.push(String(e));
      app.mount('#app');
      nextTick(() => { window.__focusProbe.ready = true });
    `,
    )
    bundle = await bounded(
      rollup({
        input: 'entry',
        plugins: [
          {
            name: 'actual-sfc-controlled-boundaries',
            resolveId(id) {
              if (modules.has(id)) return `\0${id}`
              if (id === 'vue')
                return require.resolve('vue/dist/vue.runtime.esm-bundler.js')
              if (
                id.startsWith('@/') ||
                id.startsWith('@packages/') ||
                id.endsWith('.vue')
              )
                throw new Error(`Uncontrolled application import: ${id}`)
            },
            load(id) {
              return modules.get(id.slice(1))
            },
            transform(code) {
              return code
                .replace(/process\.env\.NODE_ENV/g, '"production"')
                .replace(/\b__VUE_OPTIONS_API__\b/g, 'true')
                .replace(/\b__VUE_PROD_DEVTOOLS__\b/g, 'false')
                .replace(
                  /\b__VUE_PROD_HYDRATION_MISMATCH_DETAILS__\b/g,
                  'false',
                )
            },
          },
          nodeResolve({ browser: true }),
        ],
        onwarn(warning) {
          throw new Error(warning.message)
        },
      }),
      'renderer compile',
    )
    const { output } = await bundle.generate({ format: 'iife' })
    const html = path.join(profile, 'focus.html')
    fs.writeFileSync(
      html,
      `<!doctype html><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'"><div id="app"></div><script>${output[0].code.replace(
        /<\/script/gi,
        '<\\/script',
      )}</script>`,
    )
    report.stage = 'sdk-window'
    // Inspected RC factory supplies its private construction token internally.
    // It does NOT start a session/broker; no SDK bytes are edited or replicated.
    const { createElectronOverlayWindow } = require(path.join(
      sdkRoot,
      'dist/lib/electron-overlay-window.js',
    ))
    const bridgeCalls = { register: 0, unregister: 0, frames: 0, remove: 0 }
    const bridge = {
      registerWindow() {
        bridgeCalls.register++
      },
      unregisterWindow() {
        bridgeCalls.unregister++
      },
      sendFrame() {
        bridgeCalls.frames++
      },
      removeWindow() {
        bridgeCalls.remove++
      },
      syncWindowGeometry() {},
      followTarget() {
        throw new Error('Unexpected target following')
      },
      stopFollowingTarget() {
        throw new Error('Unexpected target following')
      },
    }
    window = new BrowserWindow({
      show: false,
      width: 500,
      height: 200,
      webPreferences: {
        session: browserSession,
        offscreen: true,
        contextIsolation: true,
        sandbox: true,
      },
    })
    window.webContents.on('console-message', (_event, ...args) => {
      if (args[0]?.level === 'error' || args[0] === 3)
        rendererErrors.push(String(args[0]?.message || args[1]))
    })
    window.webContents.on('render-process-gone', (_event, details) =>
      rendererErrors.push(details.reason),
    )
    sdkWindow = createElectronOverlayWindow(bridge, {
      id: 'actual-vue-focus',
      existingWindow: window,
    })
    await bounded(
      window.loadFile(html, {
        query: { 'game-overlay': '', 'experimental-game-overlay': '' },
      }),
      'load actual Vue',
    )
    const read = () =>
      window.webContents.executeJavaScript(`(() => {
      const input = document.querySelector('input');
      return { ready: window.__focusProbe?.ready, focused: !!input && document.activeElement === input,
        text: input?.value, buttonPresent: !!document.querySelector('[data-offscreen-focus-fix]'),
        clicks: window.__focusProbe?.clicks, events: window.__focusProbe?.events,
        errors: window.__focusProbe?.errors, hasAutofocus: !!document.querySelector('[autofocus]') };
    })()`)
    async function waitFor(predicate, label) {
      const deadline = Date.now() + 4000
      while (Date.now() < deadline) {
        const state = await read()
        assert.deepEqual(rendererErrors, [], 'renderer errors')
        assert.deepEqual(state.errors || [], [], 'Vue errors')
        if (predicate(state)) return state
        await new Promise((resolve) => setTimeout(resolve, 20))
      }
      throw new Error(`${label} deadline exceeded`)
    }
    let state = await waitFor((s) => s.ready, 'Vue ready')
    assert.equal(
      state.buttonPresent,
      false,
      'experimental giant button must be absent',
    )
    assert.equal(state.hasAutofocus, false, 'no autofocus fixture')
    assert.equal(
      state.focused,
      true,
      'production InputBar selects first DOM input before SDK focus',
    )
    report.samples.push({ phase: 'mounted-before-sdk-focus', ...state })
    report.stage = 'first-show'
    sdkWindow.show()
    sdkWindow.focus()
    await waitFor((s) => s.focused, 'first-show DOM focus')
    window.webContents.sendInputEvent({ type: 'char', keyCode: 'a' })
    state = await waitFor((s) => s.text === 'a', 'first character')
    report.samples.push({ phase: 'first-show-first-character', ...state })
    window.webContents.sendInputEvent({ type: 'char', keyCode: 'b' })
    await waitFor((s) => s.text === 'ab', 'first-show text')
    report.stage = 'hide-blur'
    sdkWindow.blur()
    sdkWindow.hide()
    state = await waitFor(
      (s) => !s.focused,
      'genuine SDK blur clears DOM focus',
    )
    assert.equal(state.text, 'ab', 'text retained while hidden')
    assert.equal(state.buttonPresent, false)
    report.samples.push({ phase: 'hidden-blurred', ...state })
    report.stage = 'reopen'
    sdkWindow.show()
    sdkWindow.focus()
    await waitFor((s) => s.focused, 'reopen DOM focus')
    window.webContents.sendInputEvent({ type: 'char', keyCode: 'c' })
    state = await waitFor((s) => s.text === 'abc', 'reopen first character')
    report.samples.push({ phase: 'reopen-first-character', ...state })
    window.webContents.sendInputEvent({ type: 'char', keyCode: 'd' })
    state = await waitFor((s) => s.text === 'abcd', 'reopen text')
    report.samples.push({ phase: 'reopen-text', ...state })
    assert.equal(state.focused, true)
    assert.equal(state.buttonPresent, false)
    assert.equal(state.clicks, 0, 'no real or synthetic clicks')
    assert.deepEqual(unexpectedRequests, [], 'no unexpected network')
    sdkWindow.setBounds({ width: 540, height: 240 })
    assert.equal(window.getBounds().width, 540)
    assert.equal(window.getBounds().height, 240)
    assert.equal(bridgeCalls.register, 2)
    assert.equal(bridgeCalls.unregister, 1)
    report.bridgeCalls = bridgeCalls
    report.status = 'passed'
    report.stage = 'complete'
  } catch (error) {
    failure = error
    report.error = error.stack
  } finally {
    for (const cleanup of [
      () => sdkWindow?.destroy(),
      () => {
        if (window && !window.isDestroyed()) window.destroy()
      },
      () => bundle?.close(),
      () => browserSession.webRequest.onBeforeRequest(null),
    ]) {
      try {
        await cleanup()
      } catch (error) {
        failure ||= error
      }
    }
    if (failure) {
      report.status = 'failed'
      report.error ||= failure.stack
    }
    save()
    console.log(
      `Focus regression evidence: ${evidencePath} (${report.status}, ${report.stage})`,
    )
  }
  if (failure) throw failure
  return report
}
