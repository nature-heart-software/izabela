import store from '@/store'
import { api } from '@/services'
import { DEFAULT_LANGUAGE_CODE } from '@/consts'
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
    return DEFAULT_LANGUAGE_CODE
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
