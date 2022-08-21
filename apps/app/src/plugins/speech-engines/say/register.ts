import { api } from '@/services'
import { DEFAULT_LANGUAGE_CODE } from '@/consts'
import { registerEngine } from '@/modules/speech-engine-manager'
import NvVoiceSelect from './NvVoiceSelect.vue'
import NvSettings from './NvSettings.vue'
import { ENGINE_ID, ENGINE_NAME } from './consts'
import { setProperty, getProperty } from './store'

registerEngine({
  id: ENGINE_ID,
  name: ENGINE_NAME,
  getCredentials() {
    return {}
  },
  getPayload(text) {
    return {
      text,
      voice: getProperty('selectedVoice'),
    }
  },
  getLanguageCode() {
    return DEFAULT_LANGUAGE_CODE
  },
  synthesizeSpeech({ credentials, payload }) {
    return api.post<Blob>(
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
