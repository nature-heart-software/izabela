import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import loadTypescript from '../../../../../../tests/load-typescript.cjs'

function voices(selectedVoice) {
  let options
  let selected = selectedVoice
  loadTypescript(fileURLToPath(new URL('./hooks.ts', import.meta.url)), {
    'vue-query': {
      useQuery: (_, __, config) => {
        options = config
      },
    },
    '@/services': {},
    './shared': {
      preferredDefaultVoiceId: 'Amy',
      getVoiceId: (voice) => voice.Id,
    },
    './store': {
      getProperty: (key) => (key === 'selectedVoice' ? selected : false),
      setProperty: (key, value) => {
        assert.equal(key, 'selectedVoice')
        selected = value
      },
    },
    './register.ts': {},
  }).useListVoicesQuery({ value: {} })
  return {
    refresh: (data) => options.onSuccess(data),
    get selected() {
      return selected
    },
  }
}

test('Polly refresh drops saved engines no longer supported by the voice/region', () => {
  const state = voices({
    Id: 'Amy',
    SupportedEngines: ['generative', 'standard'],
  })
  state.refresh([{ Id: 'Amy', SupportedEngines: ['neural', 'standard'] }])
  assert.deepEqual(Array.from(state.selected.SupportedEngines), [
    'standard',
    'neural',
  ])
})

test('Polly refresh replaces an unavailable saved engine with a valid engine', () => {
  const state = voices({ Id: 'Amy', SupportedEngines: ['standard'] })
  state.refresh([{ Id: 'Amy', SupportedEngines: ['neural'] }])
  assert.deepEqual(Array.from(state.selected.SupportedEngines), ['neural'])
})

test('Polly refresh preserves a supported engine preference', () => {
  const state = voices({ Id: 'Amy', SupportedEngines: ['standard', 'neural'] })
  state.refresh([{ Id: 'Amy', SupportedEngines: ['neural', 'standard'] }])
  assert.deepEqual(Array.from(state.selected.SupportedEngines), [
    'standard',
    'neural',
  ])
})

test('Polly refresh falls back to Amy or the first available voice', () => {
  for (const Id of ['Amy', 'Joanna']) {
    const state = voices({
      Id: 'Unavailable',
      SupportedEngines: ['generative'],
    })
    state.refresh([{ Id, SupportedEngines: ['neural'] }])
    assert.equal(state.selected.Id, Id)
    assert.deepEqual(Array.from(state.selected.SupportedEngines), ['neural'])
  }
})

test('an empty Polly voice list clears stale selection without throwing', () => {
  const state = voices({ Id: 'Amy', SupportedEngines: ['standard'] })
  state.refresh([])
  assert.equal(state.selected, null)
})
