import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import * as vue from 'vue'
import loadTypescript from '../../../../../../../tests/load-typescript.cjs'
const flush = () => new Promise((resolve) => setImmediate(resolve))
async function fixture() {
  const keyboard = []
  const power = new EventEmitter(),
    scope = vue.effectScope()
  const settings = vue.reactive({
    enableSTTTS: true,
    speechRecognitionStrategy: 'ptr',
    keybindings: { recordAudio: [] },
  })
  const speech = vue.reactive({
    recording: false,
    $patch(values) {
      Object.assign(this, values)
    },
  })
  let started = 0,
    stopped = 0
  const create = loadTypescript(
    fileURLToPath(new URL('./index.ts', import.meta.url)),
    {
      vue,
      '@google-cloud/speech': {},
      electron: {
        powerMonitor: power,
        screen: {
          getAllDisplays: () => [],
          getPrimaryDisplay: () => ({ bounds: { x: 0, y: 0 } }),
        },
      },
      'electron-postman': {},
      '@/utils/electron-notification': {},
      '@/features/speech/store': { useSpeechRecognitionStore: () => speech },
      '@/features/settings/store': { useSettingsStore: () => settings },
      '@/modules/electron-keybinding/utils': {
        gkl: { addListener: (fn) => keyboard.push(fn) },
        keybindingTriggered: () => true,
        keybindingReleased: () => true,
      },
      '@packages/toolbox': {
        Deferred() {
          let resolve
          const promise = new Promise((r) => {
            resolve = r
          })
          return { promise, resolve }
        },
      },
      '@/teams/speech-worker/modules/electron-native-speech-recognition':
        () => {
          started++
          let done = false
          return () => {
            if (!done) {
              done = true
              stopped++
            }
          }
        },
      '@/modules/electron-window-manager': {},
      '@/utils/time': { getTime: () => 'fixture' },
      '@/teams/speech-worker/electron/const': {
        windowHeight: 1,
        windowWidth: 1,
      },
      '@/electron/utils': {
        getTopLeftWindow: () => ({ bounds: { x: 0, y: 0 } }),
      },
      '@/features/display/utils': { findDisplay: () => null },
      '@/modules/speech-recognition-engine-manager': { getEngines: () => [] },
    },
  ).ElectronSpeechWindow
  const controller = scope.run(create)
  const contents = new EventEmitter()
  controller.start({ setPosition() {}, webContents: contents })
  await flush()
  return {
    power,
    settings,
    speech,
    controller,
    contents,
    press: () => keyboard.forEach((fn) => fn({ state: 'DOWN' })),
    active: () => started - stopped,
    counts: () => [started, stopped],
    dispose() {
      settings.enableSTTTS = false
      controller.restartNativeSpeechRecognition()
      scope.stop()
    },
  }
}

test('renderer crash stops capture and clears held recording until the replacement renderer loads', async () => {
  const f = await fixture()
  try {
    f.speech.recording = true
    f.contents.emit('render-process-gone')
    assert.equal(f.active(), 0)
    assert.equal(f.speech.recording, false)
    f.press()
    assert.equal(
      f.speech.recording,
      false,
      'Key repeat during reload must not restore held recording',
    )
    f.controller.restartNativeSpeechRecognition()
    assert.equal(f.active(), 0)
    f.contents.emit('did-finish-load')
    assert.equal(f.active(), 1)
    assert.equal(f.speech.recording, false)
  } finally {
    f.dispose()
  }
})
test('suspend releases capture and held recording; settings changes wait until resume', async () => {
  const f = await fixture()
  try {
    f.speech.recording = true
    await flush()
    f.power.emit('suspend')
    await flush()
    assert.equal(f.active(), 0)
    assert.equal(f.speech.recording, false)
    assert.equal(f.settings.enableSTTTS, true)
    f.settings.selectedSpeechRecognitionEngine = 'another'
    await flush()
    assert.equal(f.active(), 0)
    f.power.emit('resume')
    await flush()
    assert.equal(f.active(), 1)
    assert.equal(f.speech.recording, false)
  } finally {
    f.dispose()
  }
})
test('repeated resume and disabled recognition never create duplicate capture', async () => {
  const f = await fixture()
  try {
    for (let index = 0; index < 25; index++) {
      f.power.emit('suspend')
      f.power.emit('resume')
      await flush()
      assert.equal(f.active(), 1)
    }
    f.settings.enableSTTTS = false
    await flush()
    f.power.emit('suspend')
    f.power.emit('resume')
    await flush()
    assert.equal(f.active(), 0)
  } finally {
    f.dispose()
  }
})
