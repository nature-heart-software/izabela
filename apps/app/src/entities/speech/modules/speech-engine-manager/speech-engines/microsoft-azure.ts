import store from '@/store'
import { decrypt } from '@/utils/security'
import { api } from '@/services'
import speechEngineManager from '../SpeechEngineManager'

const getCredentials = () => ({
  apiKey: decrypt(store.getters['settings/persisted'].MATTSApiKey),
  region: store.getters['settings/persisted'].MATTSRegion,
})

speechEngineManager.registerEngine({
  id: 'matts',
  name: 'Microsoft Azure',
  getCredentials,
  hasCredentials() {
    return Object.values(getCredentials()).every(Boolean)
  },
  getPayload(text) {
    return {
      text,
      voice: store.getters['settings/persisted'].MATTSSelectedVoice,
    }
  },
  getLanguageCode() {
    return store.getters['settings/persisted'].MATTSSelectedVoice.Locale
  },
  synthesizeSpeech({ credentials, payload }) {
    return api.post<Blob>(
      '/tts/microsoft-azure/synthesize-speech',
      {
        credentials,
        payload,
      },
      { responseType: 'blob' },
    )
  },
})
