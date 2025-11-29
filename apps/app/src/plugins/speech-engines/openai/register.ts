import { fetchApi } from '@/services'
import { registerEngine } from '@/modules/speech-engine-manager'
import NvVoiceSelect from './NvVoiceSelect.vue'
import NvSettings from './NvSettings.vue'
import { Credentials, ENGINE_ID, ENGINE_NAME, getVoiceName } from './shared'
import { getProperty, store } from './store'
import { DEFAULT_LANGUAGE_CODE } from '@/consts.ts'
import { useSpeechStore } from '@/features/speech/store'
import { SpeechEngine } from '@/modules/speech-engine-manager/types.ts'

const getCredentials: SpeechEngine<Credentials>['getCredentials'] = () => ({
  apiKey:
    getProperty('apiKey', true) ||
    import.meta.env.VITE_SPEECH_ENGINE_OPENAI_API_KEY,
})

const getSelectedVoice = () => getProperty('selectedVoice')
export const engine = registerEngine({
  id: ENGINE_ID,
  name: ENGINE_NAME,
  category: 'cloud',
  getSelectedVoice,
  getVoiceName,
  getCredentials,
  hasCredentials() {
    return Object.values(getCredentials()).every(Boolean)
  },
  getPayload({ text, translatedText, voice: v, command }) {
    const voice = v || getSelectedVoice()
    const { customCommands } = useSpeechStore()
    const customCommand = customCommands.find((e) => e.value === command)
    return {
      voice,
      input: translatedText || text,
      instructions: store.getProperty('instructions'),
      userInstructions: store.getProperty('useCommandDescriptionAsInstruction')
        ? customCommand?.description
        : null,
    }
  },
  getLanguageCode() {
    return DEFAULT_LANGUAGE_CODE
  },
  synthesizeSpeech({ credentials, payload }) {
    return fetchApi(
      'local',
      `/tts/openai/synthesize-speech${
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
