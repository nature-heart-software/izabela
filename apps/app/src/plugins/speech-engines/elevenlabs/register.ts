import { registerEngine } from '@/modules/speech-engine-manager'
import { DEFAULT_LANGUAGE_CODE } from '@/consts'
import axios from 'axios'
import NvVoiceSelect from './NvVoiceSelect.vue'
import NvSettings from './NvSettings.vue'
import { ENGINE_ID, ENGINE_NAME, getVoiceName } from './shared'
import { getProperty, setProperty } from './store'

const getCredentials = () => ({
  apiKey: getProperty('apiKey', true),
})

const getSelectedVoice = () => getProperty('selectedVoice')
registerEngine({
  id: ENGINE_ID,
  name: ENGINE_NAME,
  getSelectedVoice,
  getVoiceName,
  getCredentials,
  hasCredentials() {
    return Object.values(getCredentials()).every(Boolean)
  },
  getPayload(text, v) {
    const voice = v || getSelectedVoice()
    return {
      text,
      voice,
    }
  },
  getLanguageCode() {
    return DEFAULT_LANGUAGE_CODE
  },
  synthesizeSpeech({ credentials, payload }) {
    return axios.post<Blob>(
      `https://api.elevenlabs.io/v1/text-to-speech/${ payload.voice.voice_id }`,
      {
        text: payload.text,
      },
      {
        responseType: 'blob', headers: {
          'xi-api-key': credentials.apiKey,
        },
      },
    )
  },
  voiceSelectComponent: NvVoiceSelect,
  settingsComponent: NvSettings,
  store: { setProperty, getProperty },
})
