import { api, fetchApi } from '@/services'
import { registerEngine } from '@/modules/speech-engine-manager'
import { DEFAULT_LANGUAGE_CODE } from '@/consts'
import { useSpeechStore } from '@/features/speech/store'
import NvVoiceSelect from './NvVoiceSelect.vue'
import NvSettings from './NvSettings.vue'
import { ENGINE_ID, ENGINE_NAME, getVoiceName } from './shared'
import { getProperty, store } from './store'

const getSelectedVoice = () => getProperty('selectedVoice')
export const engine = registerEngine({
  id: ENGINE_ID,
  name: ENGINE_NAME,
  category: 'cloud',
  getRegions: () =>
    api('remote')
      .get('/tts/izabela/list-regions')
      .then(({ data }) => data),
  getSelectedVoice,
  getVoiceName,
  hasCredentials() {
    const speechStore = useSpeechStore()
    return speechStore.hasUniversalApiCredentials
  },
  getCredentials() {
    return {}
  },
  getPayload({ text, translatedText, voice: v }) {
    const voice = v || getSelectedVoice()
    return {
      text: translatedText || text,
      voice,
    }
  },
  getLanguageCode() {
    return DEFAULT_LANGUAGE_CODE
  },
  synthesizeSpeech({ payload: { region, ...payload } }) {
    return fetchApi(
      'remote',
      `/tts/izabela/synthesize-speech${
        getProperty('streamAudio') ? '/stream' : ''
      }`,
      {
        method: 'POST',
        body: JSON.stringify({
          payload,
        }),
      },
      region,
    )
  },
  getUseCacheOnEveryRequest() {
    return getProperty('useCacheOnEveryRequest')
  },
  voiceSelectComponent: NvVoiceSelect,
  settingsComponent: NvSettings,
  store,
})
