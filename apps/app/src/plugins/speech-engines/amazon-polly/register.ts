import store from '@/store'
import { decrypt } from '@/utils/security'
import { api } from '@/services'
import { registerEngine } from '@/modules/speech-engine-manager'
import NvVoiceSelect from './NvVoiceSelect.vue'
import NvSettings from './NvSettings.vue'
import { ENGINE_ID, ENGINE_NAME } from './consts'

const getCredentials = () => ({
  identityPoolId: decrypt(store.getters['settings/persisted'].APTTSIdentityPoolId),
  region: store.getters['settings/persisted'].APTTSRegion,
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
  voiceSelectComponent: NvVoiceSelect,
  settingsComponent: NvSettings,
})
