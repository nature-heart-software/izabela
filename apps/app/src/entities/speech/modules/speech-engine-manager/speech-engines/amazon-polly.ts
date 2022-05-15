import store from '@/store'
import { decrypt } from '@/utils/security'
import { api } from '@/services'
import speechEngineManager from '../SpeechEngineManager'

speechEngineManager.registerEngine({
  id: 'aptts',
  name: 'Amazon Polly',
  getCredentials() {
    return {
      identityPoolId: decrypt(store.getters['settings/persisted'].APTTSIdentityPoolId),
      region: store.getters['settings/persisted'].APTTSRegion,
    }
  },
  getPayload(text) {
    return {
      text,
      voice: store.getters['settings/persisted'].APTTSSelectedVoice,
    }
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
