const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const childProcess = require('node:child_process')
const { app, BrowserWindow } = require('electron')
const { additionalCases } = require('./contracts.cjs')
const config = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'))
process.argv = process.argv.slice(0, 2)
const root = path.resolve(__dirname, '../..')
const fixture = path.join(__dirname, 'fixtures/speech.wav')
const failures = []
const unhandled = []
const captures = []
const events = []
let worker
let messenger
let socket
let current = 'startup'

app.setName('Izabela App Regression Tests')
app.setPath('userData', path.join(config.directory, 'profile'))
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
        fixture,
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
    window.webContents.executeJavaScript(
      `(${fn.toString()})(...${JSON.stringify(args)})`,
      true,
    ),
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
    id === 'messenger-window' ? messenger : worker,
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
      store(id) {
        const store = document
          .querySelector('#app')
          .__vue_app__.config.globalProperties.$pinia._s.get(id)
        if (!store) throw new Error('Missing application store: ' + id)
        return store
      },
    })
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
        })
        this.addEventListener('ended', () => {
          record.ended = true
          record.duration = this.duration
          clearInterval(timer)
          context.close()
        })
        this.addEventListener('error', () => {
          record.error = this.error?.message || 'Audio error'
          clearInterval(timer)
          context.close()
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
  await sleep(30)
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
  if (config.live && additionalCases(config.providers).length)
    await check(
      'translation: Amazon Translate with Nanami Auto/Auto',
      async () => {
        await selectTts('matts')
        await evaluate(
          worker,
          async (port) => {
            const engine = window.__appTest.store('speech').currentSpeechEngine
            const response = await fetch(
              'http://localhost:' +
                port +
                '/api/tts/microsoft-azure/list-voices',
              {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ credentials: engine.getCredentials() }),
              },
            )
            if (!response.ok)
              throw new Error('Azure voice listing failed: ' + response.status)
            const voices = await response.json()
            const voice = voices.find(
              (voice) => voice.ShortName === 'ja-JP-NanamiNeural',
            )
            if (!voice) throw new Error('Nanami was not returned by Azure')
            window.__appTest
              .store('plugin-matts')
              .$patch({ pluginState: { selectedVoice: voice } })
            window.__appTest
              .store('plugin-amazon-translate-translation')
              .$patch({
                pluginState: { translateFrom: null, translateTo: null },
              })
          },
          process.env.VITE_SERVER_PORT || 7070,
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
  await check(
    'app: no uncaught errors or leaked capture processes',
    async () => {
      assert.deepEqual(unhandled, [])
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
  config.live ? 18 * 60000 : 150000,
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
