import store from '@/store'
import { decrypt } from '@/utils/security'
import { api } from '@/services'
import { registerEngine } from '@/entities/speech/modules/speech-engine-manager'
import NvVoiceSelect from './NvVoiceSelect.vue'
import NvSettings from './NvSettings.vue'

const getCredentials = () => ({
  apiKey: decrypt(store.getters['settings/persisted'].MATTSApiKey),
  region: store.getters['settings/persisted'].MATTSRegion,
})

registerEngine({
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
  voiceSelectComponent: NvVoiceSelect,
  settingsComponent: NvSettings,
})
