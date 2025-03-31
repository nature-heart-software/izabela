import { api } from '@/services'
import { registerEngine } from '@/modules/speech-engine-manager'
import { useSpeechStore } from '@/features/speech/store'
import NvVoiceSelect from './NvVoiceSelect.vue'
import NvSettings from './NvSettings.vue'
import { ENGINE_ID, ENGINE_NAME, getVoiceName } from './shared'
import { getProperty, setProperty } from './store'
import { axiosBlobResponseToBlob, axiosStreamResponseToMediaSource } from '@/utils/fetch.ts'

const getCredentials = () => ({
  identityPoolId: getProperty('identityPoolId', true),
  region: getProperty('region'),
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
  getPayload({ text, translatedText, voice }) {
    return {
      Text: translatedText || text,
      VoiceId: (voice || getSelectedVoice()).Id,
    }
  },
  getLanguageCode(voice) {
    return (voice || getSelectedVoice()).LanguageCode
  },
  synthesizeSpeech({ credentials, payload }) {
    const speechStore = useSpeechStore()
    return api(getProperty('useLocalCredentials') ? 'local' : 'remote')
      .post(
        `/tts/amazon-polly/synthesize-speech${ speechStore.streamAudio ? '/stream' : '' }`,
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
