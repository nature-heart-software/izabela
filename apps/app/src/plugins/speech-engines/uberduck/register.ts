import { api } from '@/services'
import { registerEngine } from '@/modules/speech-engine-manager'
import { useSpeechStore } from '@/features/speech/store'
import NvVoiceSelect from './NvVoiceSelect.vue'
import NvSettings from './NvSettings.vue'
import { ENGINE_ID, ENGINE_NAME, getVoiceName } from './shared'
import { getProperty, setProperty } from './store'

const getCredentials = () => ({
  publicKey: getProperty('publicKey', true),
  privateKey: getProperty('privateKey', true),
})

const getSelectedVoice = () => getProperty('selectedVoice')
registerEngine({
  id: ENGINE_ID,
  name: ENGINE_NAME,
  getSelectedVoice,
  getVoiceName,
  getCredentials,
  hasCredentials() {
    const speechStore = useSpeechStore()
    return speechStore.hasUniversalApiCredentials || Object.values(getCredentials()).every(Boolean)
  },
  getPayload(text, voice) {
    return {
      speech: text,
      voicemodel_uuid: (voice || getSelectedVoice()).voicemodel_uuid,
    }
  },
  getLanguageCode() {
    return getSelectedVoice().language
  },
  synthesizeSpeech({ credentials, payload }) {
    return api(getProperty('useLocalCredentials') ? 'local' : 'remote').post<Blob>(
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
