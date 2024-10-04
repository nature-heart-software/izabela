import { api } from '@/services'
import { DEFAULT_LANGUAGE_CODE } from '@/consts'
import { registerEngine } from '@/modules/speech-engine-manager'
import NvVoiceSelect from './NvVoiceSelect.vue'
import NvSettings from './NvSettings.vue'
import { ENGINE_ID, ENGINE_NAME, getVoiceName } from './shared'
import { getProperty, setProperty } from './store'

const getSelectedVoice = () => getProperty('selectedVoice')
registerEngine({
  id: ENGINE_ID,
  name: ENGINE_NAME,
  category: 'local',
  getSelectedVoice,
  getVoiceName,
  getCredentials() {
    return {}
  },
  getPayload({ text, translatedText, voice }) {
    return {
      text: translatedText || text,
      voice: voice || getSelectedVoice(),
      speed: getProperty('speed') / 100,
    }
  },
  getLanguageCode() {
    return DEFAULT_LANGUAGE_CODE
  },
  synthesizeSpeech({ credentials, payload }) {
    return api('local').post<Blob>(
      '/tts/say/synthesize-speech',
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
