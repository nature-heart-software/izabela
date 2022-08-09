import { api } from '@/services'
import { registerEngine } from '@/modules/speech-engine-manager'
import NvVoiceSelect from './NvVoiceSelect.vue'
import NvSettings from './NvSettings.vue'
import { ENGINE_ID, ENGINE_NAME } from './consts'
import { getProperty } from './store'

const getCredentials = () => ({
  identityPoolId: getProperty('identityPoolId', true),
  region: getProperty('region'),
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
      voice: getProperty('selectedVoice'),
    }
  },
  getLanguageCode() {
    return getProperty('selectedVoice').LanguageCode
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
