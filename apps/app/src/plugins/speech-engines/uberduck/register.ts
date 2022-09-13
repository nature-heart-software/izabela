import { api } from '@/services'
import { registerEngine } from '@/modules/speech-engine-manager'
import NvVoiceSelect from './NvVoiceSelect.vue'
import NvSettings from './NvSettings.vue'
import { ENGINE_ID, ENGINE_NAME } from './consts'
import { getProperty, setProperty } from './store'

const getCredentials = () => ({
  publicKey: getProperty('publicKey', true),
  privateKey: getProperty('privateKey', true),
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
      voicemodel_uuid: getProperty('selectedVoice').voicemodel_uuid,
    }
  },
  getLanguageCode() {
    return getProperty('selectedVoice').language
  },
  synthesizeSpeech({ credentials, payload }) {
    return api.post<Blob>(
      '/tts/uberduck/synthesize-speech',
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
