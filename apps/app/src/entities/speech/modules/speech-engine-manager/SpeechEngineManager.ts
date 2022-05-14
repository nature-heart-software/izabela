import { SpeechEngine } from '@/entities/speech/modules/speech-engine-manager/types'

class SpeechEngineManager {
  private speechEngines: SpeechEngine[] = []

  public registerEngine(speechEngine: SpeechEngine) {
    this.speechEngines.push(speechEngine)
  }

  public getEngineById(id: SpeechEngine['id']) {
    return this.speechEngines.find((speechEngine) => speechEngine.id === id)
  }

  public getEngines() {
    return this.speechEngines
  }
}

export default new SpeechEngineManager()
