// eslint-disable-next-line import/no-cycle
import { SpeechEngine } from '@/modules/speech-engine-manager/types'
import { ref } from 'vue'
// eslint-disable-next-line import/no-cycle
import { useDictionaryStore } from '@/features/dictionary/store'

const SpeechEngineManager = () => {
  const engines = ref<SpeechEngine[]>([])

  async function withDictionary(speechEngine: SpeechEngine): Promise<SpeechEngine> {
    const dictionaryStore = useDictionaryStore()
    await dictionaryStore.$whenReady()
    return {
      ...speechEngine,
      getPayload: (options) =>
        speechEngine.getPayload({
          ...options,
          text: dictionaryStore.enableDictionary
            ? dictionaryStore.translateText(options.text)
            : options.text,
        }),
    }
  }

  async function registerEngine(speechEngine: SpeechEngine) {
    engines.value.push(await withDictionary(speechEngine))
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
