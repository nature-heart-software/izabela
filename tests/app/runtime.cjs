const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const childProcess = require('node:child_process')
const { app, BrowserWindow } = require('electron')
const { additionalCases } = require('./contracts.cjs')
const { runJourneys } = require('./journeys.cjs')
const config = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'))
process.argv = process.argv.slice(0, 2)
const root = path.resolve(__dirname, '../..')
const fixture = path.join(__dirname, 'fixtures/speech.wav')
let captureFixture = fixture
const failures = []
const unhandled = []
const captures = []
const events = []
const trayRecords = []
const { Tray } = require('electron')
const originalSetContextMenu = Tray.prototype.setContextMenu
Tray.prototype.setContextMenu = function (menu) {
  trayRecords.push({ tray: this, menu })
  return originalSetContextMenu.call(this, menu)
}
let worker
let messenger
let socket
let current = 'startup'

app.setName('Izabela App Regression Tests')
app.setPath(
  'userData',
  path.join(
    config.directory,
    config.phase ? 'profile-' + config.phase : 'profile',
  ),
)
fs.mkdirSync(path.join(config.directory, 'temp'), { recursive: true })
app.setPath('temp', path.join(config.directory, 'temp'))
fs.mkdirSync(path.join(config.directory, 'logs'), { recursive: true })
app.setAppLogsPath(path.join(config.directory, 'logs'))
app.setLoginItemSettings = () => {} // No startup-registry changes from test runs.
app.commandLine.appendSwitch('no-sandbox')
app.commandLine.appendSwitch('use-fake-device-for-media-stream')
app.commandLine.appendSwitch('use-fake-ui-for-media-stream')
app.commandLine.appendSwitch('use-file-for-fake-audio-capture', fixture)
const originalSpawn = childProcess.spawn
childProcess.spawn = function (command, args, options) {
  if (/[\\/]sox\.exe$/i.test(String(command))) {
    const child = originalSpawn(
      process.execPath,
      [
        path.join(__dirname, 'audio-source.cjs'),
        captureFixture,
        String(args[args.indexOf('--rate') + 1]),
      ],
      {
        ...options,
        windowsHide: true,
        env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
      },
    )
    const capture = { bytes: 0, closed: false }
    captures.push(capture)
    child.stdout.on('data', (bytes) => {
      capture.bytes += bytes.length
    })
    child.once('close', () => {
      capture.closed = true
    })
    return child
  }
  return originalSpawn.call(this, command, args, options)
}
process.on('unhandledRejection', (error) => {
  unhandled.push({ case: current, message: String(error?.stack || error) })
})
process.on('uncaughtException', (error) => {
  unhandled.push({ case: current, message: String(error?.stack || error) })
})

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
async function until(check, label, timeout = 15000) {
  const deadline = Date.now() + timeout
  while (Date.now() < deadline) {
    const value = await check()
    if (value) return value
    await sleep(50)
  }
  throw new Error('Timed out: ' + label)
}
const evaluate = (window, fn, ...args) =>
  Promise.race([
    window.webContents
      .executeJavaScript(
        `(async () => { try { return await (${fn.toString()})(...${JSON.stringify(
          args,
        )}) }
        catch (error) { return { __appTestThrown: String(error.stack || error) } } })()`,
        true,
      )
      .then((result) => {
        if (result?.__appTestThrown) throw new Error(result.__appTestThrown)
        return result
      }),
    sleep(8000).then(() => {
      throw new Error(
        'Renderer did not respond: ' + window.webContents.getURL(),
      )
    }),
  ])
const patch = (id, values) =>
  evaluate(
    worker,
    (id, values) => window.__appTest.store(id).$patch(values),
    id,
    values,
  )
const read = (id, property) =>
  evaluate(
    ['messenger-window', 'messenger'].includes(id) ? messenger : worker,
    (id, key) => JSON.parse(JSON.stringify(window.__appTest.store(id)[key])),
    id,
    property,
  )
async function check(name, fn) {
  current = name
  console.log('APP_PHASE ' + name)
  const start = Date.now()
  try {
    await fn()
    console.log(
      'APP_TEST ' +
        JSON.stringify({ name, pass: true, duration: Date.now() - start }),
    )
  } catch (error) {
    failures.push(name)
    console.log(
      'APP_TEST ' +
        JSON.stringify({
          name,
          pass: false,
          duration: Date.now() - start,
          error: String(error.stack || error),
        }),
    )
    if (messenger?.isVisible())
      try {
        const image = await Promise.race([
          messenger.webContents.capturePage(),
          sleep(2000).then(() => null),
        ])
        if (image)
          fs.writeFileSync(
            path.join(
              config.reportDirectory,
              name.replace(/[^a-z0-9]+/gi, '-') + '.png',
            ),
            image.toPNG(),
          )
      } catch {}
  }
}
async function instrument(window) {
  window.webContents.setAudioMuted(true)
  await evaluate(window, () => {
    const state = (window.__appTest = {
      audio: [],
      errors: [],
      store(id) {
        const store = document
          .querySelector('#app')
          .__vue_app__.config.globalProperties.$pinia._s.get(id)
        if (!store) throw new Error('Missing application store: ' + id)
        return store
      },
    })
    const objectUrls = new Set()
    state.objectUrls = objectUrls
    const createObjectURL = URL.createObjectURL.bind(URL)
    const revokeObjectURL = URL.revokeObjectURL.bind(URL)
    URL.createObjectURL = (...args) => {
      const url = createObjectURL(...args)
      objectUrls.add(url)
      return url
    }
    URL.revokeObjectURL = (url) => {
      objectUrls.delete(url)
      return revokeObjectURL(url)
    }
    window.addEventListener('error', (event) =>
      state.errors.push(String(event.error?.stack || event.message)),
    )
    window.addEventListener('unhandledrejection', (event) =>
      state.errors.push(String(event.reason?.stack || event.reason)),
    )
    const original = HTMLMediaElement.prototype.play
    HTMLMediaElement.prototype.play = function (...args) {
      if (!this.__appTestAudio) {
        const record = (this.__appTestAudio = {
          playing: false,
          ended: false,
          error: null,
          peak: 0,
          duration: 0,
        })
        state.audio.push(record)
        const context = new AudioContext()
        const source = context.createMediaElementSource(this)
        const analyser = context.createAnalyser()
        source.connect(analyser).connect(context.destination)
        context.resume()
        const data = new Float32Array(analyser.fftSize)
        const timer = setInterval(() => {
          analyser.getFloatTimeDomainData(data)
          for (const value of data)
            record.peak = Math.max(record.peak, Math.abs(value))
        }, 20)
        this.addEventListener('playing', () => {
          record.playing = true
          record.duration = this.duration
        })
        this.addEventListener('ended', () => {
          record.ended = true
          if (Number.isFinite(this.duration)) record.duration = this.duration
          clearInterval(timer)
          context.close()
        })
        this.addEventListener('error', () => {
          record.error = this.error?.message || 'Audio error'
          clearInterval(timer)
          context.close()
        })
        this.addEventListener('emptied', () => {
          clearInterval(timer)
          void context.close().catch(() => {})
        })
      }
      return original.apply(this, args)
    }
  })
}
async function selectTts(id) {
  await patch('settings', {
    selectedSpeechEngine: id,
    enableTranslation: false,
  })
  await until(
    () =>
      evaluate(
        messenger,
        (id) => window.__appTest.store('speech').currentSpeechEngine?.id === id,
        id,
      ),
    'select TTS ' + id,
  )
  if (id !== 'saytts')
    await until(
      () =>
        evaluate(
          messenger,
          (id) =>
            Boolean(
              window.__appTest.store('plugin-' + id).pluginState.selectedVoice,
            ),
          id,
        ),
      'voice catalog ' + id,
      30000,
    )
  await evaluate(
    worker,
    (id) => {
      const store = window.__appTest.store('plugin-' + id)
      store.$patch({
        pluginState: {
          useCacheOnEveryRequest: false,
          ...('useLocalCredentials' in store.pluginState
            ? { useLocalCredentials: true }
            : {}),
        },
      })
    },
    id,
  )
}
async function submit(text) {
  // Submit through the real messenger input and its Enter handler.
  await evaluate(
    messenger,
    (text) => {
      const input = document.querySelector(
        'input[data-v-step="messenger-text-input"], [data-v-step="messenger-text-input"] input',
      )
      if (!input) throw new Error('Messenger text input not found')
      input.focus()
      input.value = text
      input.dispatchEvent(new Event('input', { bubbles: true }))
    },
    text,
  )
  await sleep(80) // The production Enter handler intentionally throttles at 40 ms.
  messenger.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Enter' })
  messenger.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'Enter' })
}
async function audioMessage(text, engine, predicate) {
  const start = events.length
  const audio = await evaluate(worker, () => window.__appTest.audio.length)
  await submit(text)
  const event = await until(
    () => {
      const recent = events.slice(start)
      if (
        recent.some(
          (e) => e.name === 'message:error' && e.payload?.engine === engine,
        )
      )
        throw new Error(
          'Application reported a synthesis/playback failure for ' +
            engine +
            '; see app.log',
        )
      return recent.find(
        (e) => e.name === 'message:start' && e.payload?.engine === engine,
      )
    },
    'message playback ' + engine,
    45000,
  )
  if (predicate) predicate(event.payload)
  await until(
    () =>
      events
        .slice(start)
        .some(
          (e) => e.name === 'message:end' && e.payload?.id === event.payload.id,
        ),
    'message ended ' + engine,
    45000,
  )
  assert.ok(
    !events
      .slice(start)
      .some(
        (e) => e.name === 'message:error' && e.payload?.id === event.payload.id,
      ),
    'App emitted message:error',
  )
  const frames = await evaluate(
    worker,
    (index) => window.__appTest.audio.slice(index),
    audio,
  )
  assert.ok(
    frames.some(
      (frame) =>
        frame.playing &&
        frame.ended &&
        frame.duration > 0 &&
        frame.peak > 0.0001,
    ),
    'No non-silent decoded audio completed playback',
  )
}
const key = (number) => ({
  key: 'F' + number,
  code: 'F' + number,
  keyCode: 111 + number,
  rawCode: 111 + number,
  charCode: 0,
  which: 111 + number,
  shiftKey: false,
  altKey: false,
  ctrlKey: false,
  metaKey: false,
})
let keyEvent
async function press(number, hold = 80) {
  keyEvent(111 + number, 0, 0, 0)
  try {
    await sleep(hold)
  } finally {
    keyEvent(111 + number, 0, 2, 0)
  }
  await sleep(80)
}
async function main() {
  // Load the shipped main bundle, not a recompiled test copy of app functions.
  require(path.join(
    config.appRoot || path.join(root, 'apps/app'),
    'dist-electron/background.js',
  ))
  await app.whenReady()
  await until(
    () => {
      const windows = BrowserWindow.getAllWindows()
      worker = windows.find((w) =>
        w.webContents.getURL().includes('speech-worker'),
      )
      messenger = windows.find(
        (w) =>
          w.webContents.getURL().includes('messenger') &&
          !w.webContents.getURL().includes('game-overlay'),
      )
      return worker && messenger
    },
    'application windows',
    30000,
  )
  for (const window of [worker, messenger]) {
    await until(
      () =>
        evaluate(window, () =>
          Boolean(document.querySelector('#app')?.__vue_app__),
        ).catch(() => false),
      'Vue application mounted',
      30000,
    )
    await instrument(window)
  }
  const settings = await read('settings', '$state')
  if (config.phase) {
    await require('./profile-upgrades.cjs').checkProfile({
      phase: config.phase,
      check,
      read,
      evaluate,
      messenger,
      worker,
      unhandled,
      profile: app.getPath('userData'),
    })
    return
  }
  if (config.resume) {
    await check(
      'persistence: configuration survives full application relaunch',
      async () => {
        const checkpoint = JSON.parse(
          fs.readFileSync(
            path.join(config.directory, 'checkpoint.json'),
            'utf8',
          ),
        )
        for (const [id, properties] of Object.entries(checkpoint.state))
          for (const [property, value] of Object.entries(properties)) {
            const actual = await read(id, property)
            if (id === 'messages' && property === 'history') {
              // Shared actions run in each process, whose creation timestamps
              // differ slightly. All saved content/voices must remain identical.
              assert.equal(actual.length, value.length)
              for (let i = 0; i < actual.length; i++)
                assert.ok(
                  Math.abs(
                    Date.parse(actual[i].createdAt) -
                      Date.parse(value[i].createdAt),
                  ) < 1000,
                  'History timestamp changed after relaunch',
                )
              const contents = (messages) =>
                messages.map(({ createdAt, ...message }) => message)
              assert.deepEqual(
                contents(actual),
                contents(value),
                'Persisted history content and voice',
              )
            } else
              assert.deepEqual(
                actual,
                value,
                'Persisted ' + id + '.' + property,
              )
          }
        const { io } = require('socket.io-client')
        socket = io(
          'http://localhost:' + (process.env.VITE_SERVER_WS_PORT || '7071'),
          { transports: ['websocket'], reconnection: false },
        )
        socket.onAny((name, payload) => events.push({ name, payload }))
        await until(() => socket.connected, 'relaunch socket')
        messenger.show()
        await audioMessage('brb', 'samtts', (message) =>
          assert.equal(message.payload.text, 'hello after restart'),
        )
        const color = await evaluate(
          messenger,
          () =>
            getComputedStyle(
              document.querySelector(
                '[data-v-step="messenger-text-input"] input, input[data-v-step="messenger-text-input"]',
              ),
            ).backgroundColor,
        )
        assert.notEqual(
          color,
          checkpoint.lightInputColor,
          'Dark theme did not render after relaunch',
        )
        assert.deepEqual(unhandled, [])
        for (const window of [worker, messenger])
          assert.deepEqual(
            await evaluate(window, () => window.__appTest.errors),
            [],
            'Unhandled renderer error after relaunch',
          )
      },
    )
    return
  }
  // All configuration is in this run's disposable profile.
  await patch('settings', {
    enableSTTTS: false,
    enableTranslation: false,
    audioOutputs: [],
    playSpeechOnDefaultPlaybackDevice: true,
    hideWindowOnMessage: false,
    hideWindowOnClickOutside: false,
    enableAutoUpdate: false,
    launchOnStartup: false,
    keybindings: {
      ...settings.keybindings,
      toggleMessengerWindow: [key(13)],
      toggleMessengerWindowAlt: [key(14)],
      toggleOverlayWindow: [key(15)],
      cancelCurrentMessage: [key(16)],
      cancelAllMessages: [key(17)],
      recordAudio: [key(18)],
    },
  })
  const koffi = require(path.join(root, 'apps/app/node_modules/koffi'))
  keyEvent = koffi
    .load('user32.dll')
    .func(
      'void __stdcall keybd_event(uint8_t bVk, uint8_t bScan, uint32_t dwFlags, uintptr_t dwExtraInfo)',
    )
  const { io } = require('socket.io-client')
  const wsPort = process.env.VITE_SERVER_WS_PORT || '7071'
  socket = io('http://localhost:' + wsPort, {
    transports: ['websocket'],
    reconnection: false,
  })
  socket.onAny((name, payload) => events.push({ name, payload }))
  await until(() => socket.connected, 'application event socket')
  await sleep(1000)

  await check('app: production boot and cross-process settings', async () => {
    if (config.appRoot?.endsWith('.asar')) {
      assert.ok(worker.webContents.getURL().startsWith('app://'))
      assert.ok(
        fs.existsSync(path.join(path.dirname(config.appRoot), 'sox/sox.exe')),
        'Packaged microphone capture executable missing',
      )
    }
    assert.ok(
      worker.webContents.getURL().startsWith('app://'),
      'Tests require production renderer bundles',
    )
    assert.equal(
      await evaluate(
        messenger,
        () => window.__appTest.store('settings').keybindings.recordAudio[0].key,
      ),
      'F18',
    )
    assert.equal(settings.enableSTTTS, false)
  })
  for (const [id, name] of [
    ['samtts', 'Sam'],
    ['animalesetts', 'Animalese'],
    ['saytts', 'Windows voices'],
  ]) {
    await check('tts: ' + name, async () => {
      await selectTts(id)
      await audioMessage('Hello application test.', id)
    })
  }
  await check('shortcut: native messenger toggle and rebind', async () => {
    const initial = await read('messenger-window', 'isShown')
    await press(13)
    await until(
      async () => (await read('messenger-window', 'isShown')) !== initial,
      'native F13 toggle',
    )
    await press(13)
    await until(
      async () => (await read('messenger-window', 'isShown')) === initial,
      'native F13 toggle back',
    )
    const bindings = await read('settings', 'keybindings')
    await patch('settings', {
      keybindings: { ...bindings, toggleMessengerWindow: [key(21)] },
    })
    await sleep(800)
    await press(13)
    assert.equal(await read('messenger-window', 'isShown'), initial)
    await press(21)
    await until(
      async () => (await read('messenger-window', 'isShown')) !== initial,
      'rebound F21',
    )
  })
  await check('shortcut: alternate messenger and overlay', async () => {
    const initial = await read('messenger-window', 'isShown')
    await press(14)
    await until(
      async () => (await read('messenger-window', 'isShown')) !== initial,
      'native alternate shortcut',
    )
    await patch('settings', { enableOverlayWindow: true })
    const overlay = BrowserWindow.getAllWindows().find((w) =>
      w.webContents.getURL().includes('/overlay/'),
    )
    const visible = overlay.isVisible()
    await press(15)
    await until(
      () => overlay.isVisible() !== visible,
      'native overlay shortcut',
    )
    await press(15)
    await until(
      () => overlay.isVisible() === visible,
      'native overlay toggle back',
    )
    await patch('settings', { enableOverlayWindow: false })
  })
  await check('shortcut: saved message and profile', async () => {
    await selectTts('samtts')
    const history = await read('messages', 'history')
    const message = {
      ...history.findLast((m) => m.engine === 'samtts'),
      id: 'e2e-saved',
      shortcut: [key(19)],
    }
    await patch('messages', { shortcutMessages: [message] })
    await patch('profiles', {
      profiles: [
        {
          id: 'e2e-profile',
          name: 'Test',
          shortcut: [key(20)],
          openMessengerOnTrigger: false,
          states: { 'settings.messageMode': 'word' },
        },
      ],
    })
    await sleep(800)
    const start = events.length
    await press(19)
    await until(
      () => events.slice(start).some((e) => e.name === 'message:start'),
      'saved-message shortcut',
    )
    await until(
      () => events.slice(start).some((e) => e.name === 'message:end'),
      'saved-message audio',
    )
    await press(20)
    await until(
      async () => (await read('settings', 'messageMode')) === 'word',
      'profile applied',
    )
    await patch('settings', { messageMode: 'sentence' })
  })
  await check(
    'shortcut: cancel current and cancel queued messages',
    async () => {
      await selectTts('samtts')
      const start = events.length
      await submit(
        'This message is deliberately long so that cancellation can be tested while audio is still playing. '.repeat(
          4,
        ),
      )
      await submit('The queued message must be cancelled too. '.repeat(4))
      await until(
        () => events.slice(start).some((e) => e.name === 'message:start'),
        'first message started',
      )
      await press(16)
      await until(
        () =>
          events.slice(start).filter((e) => e.name === 'message:start')
            .length === 2,
        'next queued message started',
      )
      await press(17)
      await until(
        async () => !(await read('playing-message', 'isPlaying')),
        'all playback cancelled',
      )
    },
  )

  await check(
    'stt: push-to-record capture, PCM, indicator, and release',
    async () => {
      await selectTts('samtts')
      await patch('settings', {
        selectedSpeechRecognitionEngine: 'custom-speech-recognition',
        speechRecognitionStrategy: 'ptr',
        enableSTTTS: true,
      })
      await until(
        () => captures.some((c) => !c.closed && c.bytes > 0),
        'capture process',
      )
      const start = events.length
      try {
        keyEvent(129, 0, 0, 0)
        await until(
          () =>
            evaluate(worker, () =>
              Boolean(document.querySelector('.animation-wrapper')),
            ),
          'push-to-record indicator',
        )
        await until(
          () =>
            events
              .slice(start)
              .filter((e) => e.name === 'speech:recording:data:chunk').length >=
            3,
          'PCM exported by actual recording pipeline',
        )
      } finally {
        keyEvent(129, 0, 2, 0)
      }
      await until(
        () =>
          events
            .slice(start)
            .some((e) => e.name === 'speech:recording:data:end'),
        'PCM recording ended',
      )
      await until(
        () =>
          evaluate(worker, () => !document.querySelector('.animation-wrapper')),
        'release hides indicator',
      )
      await patch('settings', { enableSTTTS: false })
      await until(() => captures.every((c) => c.closed), 'capture cleanup')
    },
  )
  await check(
    'stt: continuous detection and disabling microphone',
    async () => {
      await patch('settings', {
        speechRecognitionStrategy: 'continuous',
        enableSTTTS: true,
      })
      await until(
        () =>
          evaluate(worker, () =>
            Boolean(document.querySelector('.animation-wrapper')),
          ),
        'real Hark detects fixture speech',
      )
      await patch('settings', { enableSTTTS: false })
      await until(
        () =>
          evaluate(worker, () => !document.querySelector('.animation-wrapper')),
        'disable hides indicator',
      )
      await until(() => captures.every((c) => c.closed), 'capture cleanup')
    },
  )

  await runJourneys({
    trayRecords,
    check,
    evaluate,
    patch,
    read,
    until,
    sleep,
    worker,
    messenger,
    events,
    selectTts,
    audioMessage,
    submit,
    press,
    socket,
    config,
    captures,
    root,
    keyEvent,
    instrument,
  })

  if (config.live)
    for (const provider of config.providers) {
      await check(provider.kind + ': ' + provider.name, async () => {
        if (provider.kind === 'tts') {
          await selectTts(provider.id)
          for (const streamAudio of [true, false]) {
            await evaluate(
              worker,
              (id, streamAudio) => {
                window.__appTest
                  .store('plugin-' + id)
                  .$patch({ pluginState: { streamAudio } })
              },
              provider.id,
              streamAudio,
            )
            await audioMessage('Hello application test.', provider.id)
          }
        } else if (provider.kind === 'translation') {
          await selectTts('samtts')
          await evaluate(
            worker,
            (id) => {
              window.__appTest.store('plugin-' + id).$patch({
                pluginState: { translateFrom: null, translateTo: 'fr' },
              })
            },
            provider.id,
          )
          await patch('settings', {
            selectedTranslationEngine: provider.id,
            enableTranslation: true,
          })
          await audioMessage(
            'The quick brown fox jumps over the lazy dog.',
            'samtts',
            (payload) => {
              assert.ok(
                typeof payload.translatedMessage === 'string' &&
                  payload.translatedMessage !== payload.message,
                'Translation silently returned the input',
              )
              assert.match(payload.translatedMessage, /renard/i)
            },
          )
          await patch('settings', { enableTranslation: false })
        } else {
          await selectTts('samtts')
          await patch('messages', { history: [] })
          await patch('settings', {
            selectedSpeechRecognitionEngine: provider.id,
            speechRecognitionStrategy: 'ptr',
            speechInputLanguage: 'en-US',
            enableSTTTS: true,
          })
          await until(
            () => captures.some((c) => !c.closed && c.bytes > 0),
            'native PCM capture',
          )
          await sleep(1200)
          const start = events.length
          keyEvent(129, 0, 0, 0) // F18, held through the known speech fixture.
          try {
            await until(
              () =>
                evaluate(worker, () =>
                  Boolean(document.querySelector('.animation-wrapper')),
                ),
              'recording indicator',
            )
            await sleep(11500)
          } finally {
            keyEvent(129, 0, 2, 0)
          }
          await until(
            () =>
              evaluate(
                worker,
                () => !document.querySelector('.animation-wrapper'),
              ),
            'indicator cleared',
          )
          const spoken = await until(
            () =>
              events
                .slice(start)
                .find(
                  (e) =>
                    e.name === 'message:start' &&
                    e.payload?.engine === 'samtts',
                ),
            'transcription returned through TTS',
            45000,
          )
          const words = String(spoken.payload.message).toLowerCase()
          assert.ok(
            [
              'quick',
              'brown',
              'fox',
              'lazy',
              'dog',
              'speech',
              'recognition',
              'test',
            ].filter((word) => words.includes(word)).length >= 3,
            'Transcript does not match the known audio fixture: ' + words,
          )
          await until(
            () =>
              events
                .slice(start)
                .some(
                  (e) =>
                    e.name === 'message:end' &&
                    e.payload?.id === spoken.payload.id,
                ),
            'transcribed audio completed',
          )
        }
      })
      await patch('settings', {
        enableSTTTS: false,
        enableTranslation: false,
      }).catch(() => {})
      await until(
        () => captures.every((c) => c.closed),
        'capture process cleanup',
        5000,
      ).catch(() => {})
    }
  if (
    config.live &&
    additionalCases(config.providers).includes(
      'translation: Amazon Translate with Nanami Auto/Auto',
    )
  )
    await check(
      'translation: Amazon Translate with Nanami Auto/Auto',
      async () => {
        // Crash recovery restores the last URL, which may be the Settings
        // dialog. Close it before interacting with the voice picker outside it.
        await evaluate(messenger, () => {
          location.hash = '/'
        })
        await sleep(300)
        await selectTts('matts')
        // Select from the rendered catalog, after the credential/catalog refresh,
        // rather than racing an independent fetch against the voice picker.
        await sleep(200)
        await until(
          () =>
            evaluate(messenger, () => {
              const query = Object.values(
                document.querySelector('#app').__vue_app__._context.provides,
              ).find((value) => value && typeof value.isFetching === 'function')
              if (!query) throw new Error('Application query client not found')
              return query.isFetching('matts-list-voices') === 0
            }),
          'Azure catalog refresh completed',
          30000,
        )
        await evaluate(messenger, () => {
          const input = document.querySelector(
            '[data-v-step="engine-voice-select"] input',
          )
          input.focus()
          input.value = 'Nanami'
          input.dispatchEvent(new Event('input', { bubbles: true }))
        })
        await until(
          () =>
            evaluate(messenger, () =>
              Boolean(
                document.querySelector('[title="ja-JP Nanami - Female"]'),
              ),
            ),
          'Nanami in voice picker',
        )
        await evaluate(messenger, () =>
          document
            .querySelector('[title="ja-JP Nanami - Female"]')
            .dispatchEvent(new MouseEvent('mousedown', { bubbles: true })),
        )
        await until(
          () =>
            evaluate(
              messenger,
              () =>
                window.__appTest.store('plugin-matts').pluginState.selectedVoice
                  ?.ShortName === 'ja-JP-NanamiNeural',
            ),
          'Nanami selection synchronized to UI',
        )
        await until(
          () =>
            evaluate(
              worker,
              () =>
                window.__appTest.store('plugin-matts').pluginState.selectedVoice
                  ?.Locale === 'ja-JP',
            ),
          'Nanami active in speech worker',
        )
        await patch('plugin-amazon-translate-translation', {
          pluginState: { translateFrom: null, translateTo: null },
        })
        await patch('settings', {
          selectedTranslationEngine: 'amazon-translate-translation',
          enableTranslation: true,
        })
        await audioMessage(
          'Hello. This is an application test.',
          'matts',
          (payload) => {
            assert.equal(payload.translatedTo, 'ja-JP')
            assert.match(
              payload.translatedMessage,
              /[\u3040-\u30ff\u4e00-\u9fff]/,
            )
          },
        )
        await patch('settings', { enableTranslation: false })
      },
    )
  if (
    config.live &&
    additionalCases(config.providers).includes(
      'stt: microphone recognition through translation and speech',
    )
  )
    await check(
      'stt: microphone recognition through translation and speech',
      async () => {
        await selectTts('samtts')
        const recognition = config.providers.find((p) => p.kind === 'stt')
        const translator = config.providers.find(
          (p) => p.kind === 'translation',
        )
        await patch('plugin-' + translator.id, {
          pluginState: { translateFrom: 'en', translateTo: 'fr' },
        })
        await patch('settings', {
          selectedTranslationEngine: translator.id,
          enableTranslation: true,
          selectedSpeechRecognitionEngine: recognition.id,
          speechRecognitionStrategy: 'ptr',
          enableSTTTS: true,
        })
        await until(
          () => captures.some((c) => !c.closed && c.bytes > 0),
          'microphone for translated recognition',
        )
        await sleep(1200)
        const start = events.length
        keyEvent(129, 0, 0, 0)
        try {
          await sleep(11500)
        } finally {
          keyEvent(129, 0, 2, 0)
        }
        const spoken = await until(
          () => events.slice(start).find((e) => e.name === 'message:start'),
          'translated transcription playback',
          45000,
        )
        assert.match(spoken.payload.originalMessage, /fox|speech|recognition/i)
        assert.match(spoken.payload.translatedMessage, /renard|reconnaissance/i)
        assert.notEqual(
          spoken.payload.translatedMessage,
          spoken.payload.originalMessage,
        )
        await until(
          () =>
            events
              .slice(start)
              .some(
                (e) =>
                  e.name === 'message:end' &&
                  e.payload.id === spoken.payload.id,
              ),
          'translated speech completed',
          45000,
        )
        await patch('settings', {
          enableSTTTS: false,
          enableTranslation: false,
        })
        await until(
          () => captures.every((c) => c.closed),
          'translated recording cleanup',
        )
      },
    )
  if (config.live && config.providers.some((p) => p.id === 'matts'))
    await check('tts: Azure expressive style command', async () => {
      await selectTts('matts')
      const style = await evaluate(
        worker,
        async (port) => {
          const engine = window.__appTest.store('speech').currentSpeechEngine
          const response = await fetch(
            'http://localhost:' + port + '/api/tts/microsoft-azure/list-voices',
            {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ credentials: engine.getCredentials() }),
            },
          )
          if (!response.ok) throw new Error('Azure voice listing failed')
          const voice = (await response.json()).find(
            (v) => v.Locale === 'en-US' && v.StyleList?.includes('cheerful'),
          )
          if (!voice)
            throw new Error('No expressive Azure English voice available')
          window.__appTest
            .store('plugin-matts')
            .$patch({ pluginState: { selectedVoice: voice } })
          return 'cheerful'
        },
        process.env.VITE_SERVER_PORT || 7070,
      )
      await sleep(300)
      await audioMessage(
        '/' + style + ' Hello, welcome to the application test.',
        'matts',
        (m) => assert.ok(m.payload.ssml.includes('style="' + style + '"')),
      )
    })
  if (config.live && config.providers.some((p) => p.id === 'openai-tts'))
    await check('tts: OpenAI instructions and custom command', async () => {
      await selectTts('openai-tts')
      await patch('speech', {
        customCommands: [
          {
            name: 'Warm',
            value: 'warm',
            description: 'Speak in a friendly, welcoming tone.',
          },
        ],
      })
      await patch('plugin-openai-tts', {
        pluginState: {
          model: 'gpt-4o-mini-tts',
          instructions: 'Speak clearly.',
          useCommandDescriptionAsInstruction: true,
        },
      })
      await audioMessage(
        '/warm Hello, welcome to the test.',
        'openai-tts',
        (m) => {
          assert.equal(m.payload.instructions, 'Speak clearly.')
          assert.equal(
            m.payload.userInstructions,
            'Speak in a friendly, welcoming tone.',
          )
          assert.equal(m.payload.input, 'Hello, welcome to the test.')
        },
      )
      await patch('speech', { customCommands: [] })
    })
  if (config.live)
    await require('./language-journeys.cjs').runLanguages({
      config,
      check,
      evaluate,
      patch,
      until,
      sleep,
      worker,
      events,
      selectTts,
      keyEvent,
      captures,
      setCaptureFixture: (filename) => {
        captureFixture = filename
      },
    })
  await check('persistence: save restart fixture', async () => {
    await selectTts('samtts')
    const renderedColor = async (theme, previousColor) => {
      await patch('settings', { theme })
      await until(
        () =>
          evaluate(
            messenger,
            (theme) => window.__appTest.store('settings').theme === theme,
            theme,
          ),
        'theme synchronized to messenger',
      )
      let last,
        stableSince = Date.now()
      return until(async () => {
        const color = await evaluate(
          messenger,
          () =>
            getComputedStyle(
              document.querySelector(
                '[data-v-step="messenger-text-input"] input, input[data-v-step="messenger-text-input"]',
              ),
            ).backgroundColor,
        )
        if (color === previousColor || color !== last) {
          last = color
          stableSince = Date.now()
          return false
        }
        return Date.now() - stableSince >= 200 ? color : false
      }, 'stable rendered ' + theme + ' theme')
    }
    const darkInputColor = await renderedColor('dark')
    const lightInputColor = await renderedColor('light', darkInputColor)
    await patch('settings', {
      theme: 'dark',
      messageMode: 'sentence',
      enableSTTTS: false,
      enableTranslation: false,
    })
    await patch('dictionary', {
      enableDictionary: true,
      definitions: [['brb', 'hello after restart']],
    })
    await renderedColor('dark', lightInputColor)
    const expected = {}
    for (const [id, properties] of Object.entries({
      settings: ['theme', 'messageMode', 'selectedSpeechEngine'],
      dictionary: ['enableDictionary', 'definitions'],
      profiles: ['profiles'],
      messages: ['shortcutMessages', 'history'],
      messenger: ['position'],
    })) {
      expected[id] = {}
      for (const property of properties)
        expected[id][property] = await read(id, property)
    }
    fs.writeFileSync(
      path.join(config.directory, 'checkpoint.json'),
      JSON.stringify({ state: expected, lightInputColor }),
    )
    await sleep(500)
  })
  await check(
    'app: no uncaught errors or leaked capture processes',
    async () => {
      assert.deepEqual(unhandled, [])
      for (const window of [worker, messenger])
        assert.deepEqual(
          await evaluate(window, () => window.__appTest.errors),
          [],
          'Unhandled renderer error',
        )
      assert.ok(
        captures.every((c) => c.closed),
        'Microphone process still running',
      )
    },
  )
}
const deadline = setTimeout(
  () => {
    console.log(
      'APP_TEST ' +
        JSON.stringify({
          name: 'app: deadline',
          pass: false,
          duration: 0,
          error: 'Application suite timed out',
        }),
    )
    app.exit(1)
  },
  config.live ? 24 * 60000 : 9 * 60000,
)
main()
  .catch((error) => {
    failures.push('startup')
    console.log(
      'APP_TEST ' +
        JSON.stringify({
          name: 'app: startup',
          pass: false,
          duration: 0,
          error: String(error.stack || error),
        }),
    )
  })
  .finally(async () => {
    clearTimeout(deadline)
    socket?.disconnect()
    if (keyEvent)
      for (let number = 13; number <= 21; number++)
        keyEvent(111 + number, 0, 2, 0)
    await patch('settings', { enableSTTTS: false }).catch(() => {})
    app.quit()
    setTimeout(() => app.exit(failures.length ? 1 : 0), 500).unref()
  })
