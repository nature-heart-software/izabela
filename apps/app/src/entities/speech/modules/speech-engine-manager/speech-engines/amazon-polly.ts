import store from '@/store'
import { decrypt } from '@/utils/security'
import { api } from '@/services'
import speechEngineManager from '../SpeechEngineManager'

const getCredentials = () => ({
  identityPoolId: decrypt(store.getters['settings/persisted'].APTTSIdentityPoolId),
  region: store.getters['settings/persisted'].APTTSRegion,
})

speechEngineManager.registerEngine({
  id: 'aptts',
  name: 'Amazon Polly',
  getCredentials,
  hasCredentials() {
    return Object.values(getCredentials()).every(Boolean)
  },
  getPayload(text) {
    return {
      text,
      voice: store.getters['settings/persisted'].APTTSSelectedVoice,
    }
  },
  getLanguageCode() {
    return store.getters['settings/persisted'].APTTSSelectedVoice.LanguageCode
  },
  synthesizeSpeech({ credentials, payload }) {
    return api.post<Blob>(
      '/tts/amazon-polly/synthesize-speech',
      {
        credentials,
        payload,
      },
      { responseType: 'blob' },
    )
  },
})
