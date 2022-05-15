import store from '@/store'
import { decrypt } from '@/utils/security'
import { api } from '@/services'
import speechEngineManager from '../SpeechEngineManager'

speechEngineManager.registerEngine({
  id: 'iwtts',
  name: 'IBM Watson',
  getCredentials() {
    return {
      apiKey: decrypt(store.getters['settings/persisted'].IWTTSApiKey),
      url: store.getters['settings/persisted'].IWTTSUrl,
    }
  },
  getPayload(text) {
    return {
      text,
      voice: store.getters['settings/persisted'].IWTTSSelectedVoice,
    }
  },
  synthesizeSpeech({ credentials, payload }) {
    return api.post<Blob>(
      '/tts/ibm-watson/synthesize-speech',
      {
        credentials,
        payload,
      },
      { responseType: 'blob' },
    )
  },
})
