import store from '@/store'
import { api } from '@/services'
import speechEngineManager from '../SpeechEngineManager'

speechEngineManager.registerEngine({
  id: 'saytts',
  name: 'Say',
  getCredentials() {
    return {}
  },
  getPayload(text) {
    return {
      text,
      voice: store.getters['settings/persisted'].SaySelectedVoice,
    }
  },
  getLanguageCode() {
    return navigator.language
  },
  synthesizeSpeech({ credentials, payload }) {
    return api.post<Blob>(
      '/tts/say/synthesize-speech',
      {
        credentials,
        payload,
      },
      { responseType: 'blob' },
    )
  },
})
