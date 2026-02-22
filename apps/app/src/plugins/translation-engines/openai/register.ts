import translationEngineManager from '@/modules/translation-engine-manager'
import { electronModuleName, ENGINE_ID, ENGINE_NAME } from './shared.ts'
import { store } from './store.ts'
import NvSettings from './NvSettings.vue'
import { TranslationEngine } from '@/modules/translation-engine-manager/types.ts'

const getCredentials: TranslationEngine['getCredentials'] = () => ({
  apiKey:
    store.getProperty('apiKey', true) ||
    import.meta.env.VITE_TRANSLATION_ENGINE_OPENAI_API_KEY,
})

const getTranslationOptions = (voiceLanguage?: string) => {
  return {
    translateFrom: store.getProperty('translateFrom') || undefined,
    translateTo: store.getProperty('translateTo') || voiceLanguage,
  }
}

export const engine = translationEngineManager.registerEngine(ENGINE_ID, {
  id: ENGINE_ID,
  name: ENGINE_NAME,
  store,
  category: 'Cloud',
  getCredentials,
  hasCredentials() {
    return Object.values(getCredentials()).every(Boolean)
  },
  settingsComponent: NvSettings,
  getTranslationOptions,
  async translate(text, voiceLanguage) {
    const credentials = getCredentials()
    try {
      const { translateFrom, translateTo } =
        getTranslationOptions(voiceLanguage)
      return await window[electronModuleName as keyof typeof window].translate({
        text,
        from: translateFrom,
        to: translateTo,
        prompt: store.getProperty('prompt'),
        model: store.getProperty('model'),
        credentials,
      })
    } catch (e) {
      return text
    }
  },
})
