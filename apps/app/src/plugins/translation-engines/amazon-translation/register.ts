import translationEngineManager from '@/modules/translation-engine-manager'
import { electronModuleName, ENGINE_ID, ENGINE_NAME } from './shared.ts'
import { store } from './store.ts'
import NvSettings from './NvSettings.vue'

const getCredentials = () => ({
  identityPoolId: store.getProperty('identityPoolId', true),
  region: store.getProperty('region'),
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
      const { translateFrom = 'auto', translateTo } = getTranslationOptions(voiceLanguage)
      return await window[electronModuleName as keyof typeof window].translate({
        text,
        from: translateFrom,
        to: translateTo,
        credentials
      })
    } catch (e) {
      return text
    }
  },
})
