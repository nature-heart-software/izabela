import store from '@/store'
import { decrypt } from '@/utils/security'
import { api } from '@/services'
import { pick } from 'lodash'
import { registerEngine } from '@/modules/speech-engine-manager'
import NvVoiceSelect from './NvVoiceSelect.vue'
import NvSettings from './NvSettings.vue'
import { ENGINE_ID, ENGINE_NAME } from './consts'

const getCredentials = () => ({
  apiKey: decrypt(store.getters['settings/persisted'].GCTTSApiKey),
})
registerEngine({
  id: ENGINE_ID,
  name: ENGINE_NAME,
  getCredentials,
  hasCredentials() {
    return Object.values(getCredentials()).every(Boolean)
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
  voiceSelectComponent: NvVoiceSelect,
  settingsComponent: NvSettings,
})
