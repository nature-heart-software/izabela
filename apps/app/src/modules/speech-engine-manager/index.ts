// eslint-disable-next-line import/no-cycle
import { SpeechEngine } from '@/modules/speech-engine-manager/types'
// eslint-disable-next-line import/no-cycle
import { useDictionaryStore } from '@/features/dictionary/store'

const SpeechEngineManager = () => {
  const engines: SpeechEngine[] = []

  function withDictionary(speechEngine: SpeechEngine): SpeechEngine {
    const dictionaryStore = useDictionaryStore()
    return {
      ...speechEngine,
      getPayload: (options) =>
        speechEngine.getPayload({
          ...options,
          text: dictionaryStore.translateText(options.text),
        }),
    }
  }

  function registerEngine(speechEngine: SpeechEngine) {
    engines.push(withDictionary(speechEngine))
  }

  function getEngineById(id: SpeechEngine['id']) {
    return engines.find((speechEngine) => speechEngine.id === id)
  }

  function getEngines() {
    return engines
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
export const {
  registerEngine,
  getEngineById,
  getEngines,
  useSpeechEngineManager,
} = instance
export default instance
