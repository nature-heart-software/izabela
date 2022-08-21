import { SpeechEngine } from '@/modules/speech-engine-manager/types'
import { ref } from 'vue'
// eslint-disable-next-line import/no-cycle
import store from '@/store'

const SpeechEngineManager = () => {
  const engines = ref<SpeechEngine[]>([])

  function withDictionary(speechEngine: SpeechEngine): SpeechEngine {
    return {
      ...speechEngine,
      getPayload: (text) =>
        speechEngine.getPayload(store.getters['dictionary/translateText'](text)),
    }
  }

  function registerEngine(speechEngine: SpeechEngine) {
    engines.value.push(withDictionary(speechEngine))
  }

  function getEngineById(id: SpeechEngine['id']) {
    return engines.value.find((speechEngine) => speechEngine.id === id)
  }

  function getEngines() {
    return engines.value
  }

  const useSpeechEngineManager = () => ({
    getEngineById,
    getEngines,
    engines,
  })
  return {
    registerEngine,
    getEngineById,
    getEngines,
    useSpeechEngineManager,
  }
}
const instance = SpeechEngineManager()
export const { registerEngine, getEngineById, getEngines, useSpeechEngineManager } = instance
export default instance
