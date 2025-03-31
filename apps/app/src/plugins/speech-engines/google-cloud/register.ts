import { api } from '@/services'
import pick from 'lodash/pick'
import { registerEngine } from '@/modules/speech-engine-manager'
import { useSpeechStore } from '@/features/speech/store'
import NvVoiceSelect from './NvVoiceSelect.vue'
import NvSettings from './NvSettings.vue'
import { ENGINE_ID, ENGINE_NAME, getVoiceName } from './shared'
import { getProperty, setProperty } from './store'
import { axiosBlobResponseToBlob, axiosStreamResponseToMediaSource } from '@/utils/fetch.ts'

const getCredentials = () => ({
  apiKey: getProperty('apiKey', true),
})

const getSelectedVoice = () => getProperty('selectedVoice')
registerEngine({
  id: ENGINE_ID,
  name: ENGINE_NAME,
  category: 'cloud',
  getSelectedVoice,
  getVoiceName,
  getCredentials,
  hasCredentials() {
    const speechStore = useSpeechStore()
    return (
      speechStore.hasUniversalApiCredentials ||
      Object.values(getCredentials()).every(Boolean)
    )
  },
  getPayload({ text, translatedText, voice: v }) {
    const selectedVoice = getSelectedVoice()
    const voice: any = pick(v || selectedVoice, [
      'name',
      'ssmlGender',
      'languageCode',
    ])
    // eslint-disable-next-line prefer-destructuring
    voice.languageCode = selectedVoice.languageCodes[0]
    return {
      input: {
        text: translatedText || text,
      },
      voice,
      audioConfig: {
        audioEncoding: 'LINEAR16',
        speakingRate: Number(getProperty('speakingRate')),
        pitch: Number(getProperty('pitch')),
        volumeGainDb: Number(getProperty('volumeGainDb')),
      },
    }
  },
  getLanguageCode(voice) {
    return (voice || getSelectedVoice()).languageCodes[0]
  },
  synthesizeSpeech({ credentials, payload }) {
    const speechStore = useSpeechStore()
    return api(getProperty('useLocalCredentials') ? 'local' : 'remote')
      .post(
        `/tts/google-cloud/synthesize-speech${ speechStore.streamAudio ? '/stream' : '' }`,
        {
          credentials,
          payload,
        },
        { responseType: speechStore.streamAudio ? 'stream' : 'blob' },
      )
      // @ts-ignore
      .then(speechStore.streamAudio ? axiosStreamResponseToMediaSource : axiosBlobResponseToBlob)
  },
  voiceSelectComponent: NvVoiceSelect,
  settingsComponent: NvSettings,
  store: { setProperty, getProperty },
})
