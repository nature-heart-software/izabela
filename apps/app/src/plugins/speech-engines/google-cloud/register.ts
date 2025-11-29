import { fetchApi } from '@/services'
import pick from 'lodash/pick'
import { registerEngine } from '@/modules/speech-engine-manager'
import { useSpeechStore } from '@/features/speech/store'
import NvVoiceSelect from './NvVoiceSelect.vue'
import NvSettings from './NvSettings.vue'
import { Credentials, ENGINE_ID, ENGINE_NAME, getVoiceName } from './shared'
import { getProperty, store } from './store'
import { SpeechEngine } from '@/modules/speech-engine-manager/types.ts'

const getCredentials: SpeechEngine<Credentials>['getCredentials'] = () => {
  const speechStore = useSpeechStore()
  return speechStore.hasUniversalApiCredentials &&
    !getProperty('useLocalCredentials')
    ? {}
    : {
        apiKey:
          getProperty('apiKey', true) ||
          import.meta.env.VITE_SPEECH_ENGINE_GOOGLE_CLOUD_API_KEY,
      }
}

const getSelectedVoice = () => getProperty('selectedVoice')
export const engine = registerEngine({
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
    return fetchApi(
      getProperty('useLocalCredentials') ? 'local' : 'remote',
      `/tts/google-cloud/synthesize-speech${
        getProperty('streamAudio') ? '/stream' : ''
      }`,
      {
        method: 'POST',
        body: JSON.stringify({
          credentials,
          payload,
        }),
      },
    )
  },
  getUseCacheOnEveryRequest() {
    return getProperty('useCacheOnEveryRequest')
  },
  voiceSelectComponent: NvVoiceSelect,
  settingsComponent: NvSettings,
  store,
})
