import { fetchApi } from '@/services'
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
        identityPoolId:
          getProperty('identityPoolId', true) ||
          import.meta.env.VITE_SPEECH_ENGINE_AMAZON_POLLY_IDENTITY_POOL_ID,
        region:
          getProperty('region') ||
          import.meta.env.VITE_SPEECH_ENGINE_AMAZON_POLLY_REGION,
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
    return fetchApi(
      getProperty('useLocalCredentials') ? 'local' : 'remote',
      `/tts/amazon-polly/synthesize-speech${
        getProperty('streamAudio') ? '/stream' : ''
      }`,
      {
        method: 'POST',
        body: JSON.stringify({
          credentials,
          payload,
          includeTimestamps: getProperty('includeTimestamps'),
        }),
      },
    )
  },
  getUseCacheOnEveryRequest() {
    if (getProperty('includeTimestamps')) return false
    return getProperty('useCacheOnEveryRequest')
  },
  voiceSelectComponent: NvVoiceSelect,
  settingsComponent: NvSettings,
  store,
})
