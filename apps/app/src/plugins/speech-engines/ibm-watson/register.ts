import { api } from '@/services'
import { registerEngine } from '@/modules/speech-engine-manager'
import NvVoiceSelect from './NvVoiceSelect.vue'
import NvSettings from './NvSettings.vue'
import { ENGINE_ID, ENGINE_NAME } from './consts'
import { getProperty, setProperty } from './store'

const getCredentials = () => ({
  apiKey: getProperty('apiKey', true),
  url: getProperty('url'),
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
    return getProperty('selectedVoice').language
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
  store: { setProperty, getProperty },
})
