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
      getPayload: (options) => {
        const payload = speechEngine.getPayload({
          ...options,
          text: dictionaryStore.translateText(options.text),
        })
        const region =
          speechEngine.getRegions &&
          !speechEngine.store.getProperty('useLocalCredentials')
            ? speechEngine.store.getProperty('remoteRegion')
            : undefined
        return region && region !== 'auto' ? { ...payload, region } : payload
      },
    }
  }

  function registerEngine(speechEngine: SpeechEngine) {
    const finalSpeechEngine = withDictionary(speechEngine)
    engineManager.registerEngine(speechEngine.id, finalSpeechEngine)
    return finalSpeechEngine
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
