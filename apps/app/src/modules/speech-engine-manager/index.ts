// eslint-disable-next-line import/no-cycle
import { SpeechEngine } from '@/modules/speech-engine-manager/types'
// eslint-disable-next-line import/no-cycle
import { useDictionaryStore } from '@/features/dictionary/store'
import { createEngineManager } from '@/modules/engine-manager'

const SpeechEngineManager = () => {
  const engineManager = createEngineManager<SpeechEngine>()

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
    engineManager.registerEngine(speechEngine.id, withDictionary(speechEngine))
  }

  function getEngineById(id: SpeechEngine['id']) {
    return engineManager.getEngineById(id)
  }

  function getEngines() {
    return engineManager.getEngines()
  }

  return {
    registerEngine,
    getEngineById,
    getEngines,
  }
}
const instance = SpeechEngineManager()
export const { registerEngine, getEngineById, getEngines } = instance
export default instance
