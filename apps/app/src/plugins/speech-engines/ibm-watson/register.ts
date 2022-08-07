import store from '@/store'
import { decrypt } from '@/utils/security'
import { api } from '@/services'
import { registerEngine } from '@/modules/speech-engine-manager'
import NvVoiceSelect from './NvVoiceSelect.vue'
import NvSettings from './NvSettings.vue'
import { ENGINE_ID, ENGINE_NAME } from './consts'

const getCredentials = () => ({
  apiKey: decrypt(store.getters['settings/persisted'].IWTTSApiKey),
  url: store.getters['settings/persisted'].IWTTSUrl,
})

registerEngine({
  id: ENGINE_ID,
  name: ENGINE_NAME,
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
  voiceSelectComponent: NvVoiceSelect,
  settingsComponent: NvSettings,
})
