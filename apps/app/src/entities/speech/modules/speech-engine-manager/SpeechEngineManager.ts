import { SpeechEngine } from '@/entities/speech/modules/speech-engine-manager/types'

const SpeechEngineManager = () => {
  const speechEngines: SpeechEngine[] = []

  function registerEngine(speechEngine: SpeechEngine) {
    speechEngines.push(speechEngine)
  }

  function getEngineById(id: SpeechEngine['id']) {
    return speechEngines.find((speechEngine) => speechEngine.id === id)
  }

  function getEngines() {
    return speechEngines
  }

  return {
    registerEngine,
    getEngineById,
    getEngines,
  }
}

export default SpeechEngineManager()
