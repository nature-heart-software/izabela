import { fetchApi } from '@/services'
import { DEFAULT_LANGUAGE_CODE } from '@/consts'
import { registerEngine } from '@/modules/speech-engine-manager'
import { defineAsyncComponent } from 'vue'
import { ENGINE_ID, ENGINE_NAME, getVoiceName } from './shared'
import { getProperty, store } from './store'

const getSelectedVoice = () => getProperty('selectedVoice')
export const engine = registerEngine({
  id: ENGINE_ID,
  name: ENGINE_NAME,
  category: 'local',
  getSelectedVoice,
  getVoiceName,
  getCredentials() {
    return {}
  },
  getPayload({ text, translatedText, voice }) {
    return {
      text: translatedText || text,
      voice: voice || getSelectedVoice(),
      speed: getProperty('speed') / 100,
    }
  },
  getLanguageCode() {
    return DEFAULT_LANGUAGE_CODE
  },
  synthesizeSpeech({ credentials, payload }) {
    return fetchApi('local', '/tts/say/synthesize-speech', {
      method: 'POST',
      body: JSON.stringify({
        credentials,
        payload,
      }),
    })
  },
  getUseCacheOnEveryRequest() {
    return getProperty('useCacheOnEveryRequest')
  },
  voiceSelectComponent: defineAsyncComponent(
    () => import('./NvVoiceSelect.vue'),
  ),
  settingsComponent: defineAsyncComponent(() => import('./NvSettings.vue')),
  store,
})
