import { api } from '@/services'
import { pick } from 'lodash'
import { registerEngine } from '@/modules/speech-engine-manager'
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
    const selectedVoice = getSelectedVoice()
    const voice: any = pick(v || selectedVoice, ['name', 'ssmlGender', 'languageCode'])
    // eslint-disable-next-line prefer-destructuring
    voice.languageCode = selectedVoice.languageCodes[0]
    return {
      input: {
        text,
      },
      voice,
      audioConfig: {
        audioEncoding: 'MP3',
        volumeGainDb: 0,
      },
    }
  },
  getLanguageCode() {
    return getSelectedVoice().languageCodes[0]
  },
  synthesizeSpeech({ credentials, payload }) {
    return api.post<Blob>(
      '/tts/google-cloud/synthesize-speech',
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
