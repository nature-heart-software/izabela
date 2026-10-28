import assert from 'node:assert/strict'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { createPinia } from 'pinia'
import loadTypescript from '../../../../../tests/load-typescript.cjs'

test('history keeps the original voice and synthesis options when the live selection changes', () => {
  const { useMessagesStore } = loadTypescript(
    fileURLToPath(new URL('./store.ts', import.meta.url)),
  )
  const store = useMessagesStore(createPinia())
  const voice = { name: 'Original voice', pitch: 64 }
  const payload = { voice, text: 'Original message', options: { speed: 72 } }
  store.addToHistory('original', {
    engine: 'samtts',
    voice,
    payload,
    credentials: { apiKey: 'must-not-be-saved' },
  })
  voice.name = 'Later voice'
  voice.pitch = 140
  payload.options.speed = 90
  assert.equal(store.history[0].voice.name, 'Original voice')
  assert.equal(store.history[0].voice.pitch, 64)
  assert.equal(store.history[0].payload.options.speed, 72)
  assert.ok(!('credentials' in store.history[0]))
})
