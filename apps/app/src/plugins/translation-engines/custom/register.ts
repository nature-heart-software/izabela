import translationEngineManager from '@/modules/translation-engine-manager'
import { ENGINE_ID, ENGINE_NAME } from './shared.ts'
import { store } from './store.ts'
import NvSettings from './NvSettings.vue'
import axios from 'axios'

const getCredentials = () => ({
  apiKey:
    store.getProperty('apiKey', true) ||
    import.meta.env.VITE_TRANSLATION_ENGINE_CUSTOM_API_KEY,
  endpoint:
    store.getProperty('endpoint') ||
    import.meta.env.VITE_TRANSLATION_ENGINE_CUSTOM_ENDPOINT,
})
const getTranslationOptions = (voiceLanguage?: string) => {
  return {
    translateFrom: store.getProperty('translateFrom') || undefined,
    translateTo: store.getProperty('translateTo') || voiceLanguage,
  }
}
translationEngineManager.registerEngine(ENGINE_ID, {
  id: ENGINE_ID,
  name: ENGINE_NAME,
  store,
  category: 'other',
  getCredentials,
  hasCredentials() {
    return Object.values(getCredentials()).every(Boolean)
  },
  settingsComponent: NvSettings,
  getTranslationOptions,
  async translate(text, voiceLanguage) {
    const { translateFrom, translateTo } = getTranslationOptions(voiceLanguage)
    const { endpoint, apiKey } = getCredentials()
    try {
      const { data } = await axios.post<string>(
        `${
          endpoint.endsWith('/') ? endpoint.slice(0, -1) : endpoint
        }/translate`,
        {
          credentials: {
            apiKey,
          },
          payload: {
            text,
            from: translateFrom,
            to: translateTo,
          },
        },
      )
      return data
    } catch (e) {
      return text
    }
  },
})
