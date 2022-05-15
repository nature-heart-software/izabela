import store from '@/store'
import { decrypt } from '@/utils/security'
import { api } from '@/services'
import speechEngineManager from '../SpeechEngineManager'

speechEngineManager.registerEngine({
  id: 'matts',
  name: 'Microsoft Azure',
  getCredentials() {
    return {
      apiKey: decrypt(store.getters['settings/persisted'].MATTSApiKey),
      region: store.getters['settings/persisted'].MATTSRegion,
    }
  },
  getPayload(text) {
    return {
      text,
      voice: store.getters['settings/persisted'].MATTSSelectedVoice,
    }
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
