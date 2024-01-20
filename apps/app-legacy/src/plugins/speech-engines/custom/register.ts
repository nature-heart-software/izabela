import { registerEngine } from '@/modules/speech-engine-manager'
import { DEFAULT_LANGUAGE_CODE } from '@/consts'
import axios from 'axios'
import NvVoiceSelect from './NvVoiceSelect.vue'
import NvSettings from './NvSettings.vue'
import { ENGINE_ID, ENGINE_NAME, getVoiceName } from './shared'
import { getProperty, setProperty } from './store'

const getSelectedVoice = () => getProperty('selectedVoice')
registerEngine({
  id: ENGINE_ID,
  name: ENGINE_NAME,
  category: 'other',
  getSelectedVoice,
  getVoiceName,
  hasCredentials() {
    return getProperty('endpoint')
  },
  getCredentials() {
    return {
      apiKey: getProperty('apiKey', true),
    }
  },
  getPayload({ text, translatedText, voice: v }) {
    const voice = v || getSelectedVoice()
    return {
      text: translatedText || text,
      voice,
    }
  },
  getLanguageCode(voice) {
    return (voice || getSelectedVoice()).languageCode || DEFAULT_LANGUAGE_CODE
  },
  synthesizeSpeech({ payload, credentials }) {
    const endpoint = getProperty('endpoint')
    return axios.post<Blob>(
      `${endpoint.endsWith('/') ? endpoint.slice(0, -1) : endpoint}/synthesize-speech`,
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
