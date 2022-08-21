import { api } from '@/services'
import { pick } from 'lodash'
import { registerEngine } from '@/modules/speech-engine-manager'
import NvVoiceSelect from './NvVoiceSelect.vue'
import NvSettings from './NvSettings.vue'
import { ENGINE_ID, ENGINE_NAME } from './consts'
import { getProperty, setProperty } from './store'

const getCredentials = () => ({
  apiKey: getProperty('apiKey', true),
})

registerEngine({
  id: ENGINE_ID,
  name: ENGINE_NAME,
  getCredentials,
  hasCredentials() {
    return Object.values(getCredentials()).every(Boolean)
  },
  getPayload(text) {
    const selectedVoice = getProperty('selectedVoice')
    const voice: any = pick(selectedVoice, ['name', 'ssmlGender', 'languageCode'])
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
    return getProperty('selectedVoice').languageCodes[0]
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
