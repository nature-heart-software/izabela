import store from '@/store'
import { decrypt } from '@/utils/security'
import { api } from '@/services'
import speechEngineManager from '../SpeechEngineManager'

speechEngineManager.registerEngine({
  id: 'gctts',
  name: 'Google Cloud',
  getCredentials() {
    return {
      apiKey: decrypt(store.getters['settings/persisted'].GCTTSApiKey),
    }
  },
  getPayload(text) {
    return {
      input: {
        text,
      },
      voice: {
        // TODO: do something about the hardcoded voice
        languageCode: 'en-GB',
        ssmlGender: 'FEMALE',
        name: store.getters['settings/persisted'].GCTTSSelectedVoice,
      },
      audioConfig: {
        audioEncoding: 'MP3',
        volumeGainDb: 0,
      },
    }
  },
  synthesizeSpeech({ credentials, payload }) {
    return api.post<Blob>(
      '/tts/google-cloud/synthesize-speech',
      {
        credentials,
        payload,
      },
      { responseType: 'blob' },
    )
  },
})
