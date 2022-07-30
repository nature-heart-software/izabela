import store from '@/store'
import { decrypt } from '@/utils/security'
import { api } from '@/services'
import speechEngineManager from '../SpeechEngineManager'

const getCredentials = () => ({
    apiKey: decrypt(store.getters['settings/persisted'].IWTTSApiKey),
    url: store.getters['settings/persisted'].IWTTSUrl,
  })

speechEngineManager.registerEngine({
  id: 'iwtts',
  name: 'IBM Watson',
  getCredentials,
  hasCredentials() {
    return Object.values(getCredentials()).every(Boolean)
  },
  getPayload(text) {
    return {
      text,
      voice: store.getters['settings/persisted'].IWTTSSelectedVoice,
    }
  },
  getLanguageCode() {
    return store.getters['settings/persisted'].IWTTSSelectedVoice.language
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
