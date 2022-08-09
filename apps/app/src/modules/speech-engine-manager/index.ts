import { SpeechEngine } from '@/modules/speech-engine-manager/types'
import { ref } from 'vue'

const SpeechEngineManager = () => {
  const engines = ref<SpeechEngine[]>([])

  function registerEngine(speechEngine: SpeechEngine) {
    engines.value.push(speechEngine)
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
