import store from '@/store'
import { decrypt } from '@/utils/security'
import { api } from '@/services'
import { pick } from 'lodash'
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
    const selectedVoice = store.getters['settings/persisted'].GCTTSSelectedVoice
    const voice: any = pick(selectedVoice, ['name', 'ssmlGender', 'languageCode'])
    // eslint-disable-next-line prefer-destructuring
    voice.languageCode = selectedVoice.languageCodes[0]
    return {
      input: {
        text,
      },
      voice,
      audioConfig: {
        audioEncoding: 'MP3',
        volumeGainDb: 0,
      },
    }
  },
  getLanguageCode() {
    return store.getters['settings/persisted'].GCTTSSelectedVoice.languageCodes[0]
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
