import translationEngineManager from '@/modules/translation-engine-manager'
import { ENGINE_ID, ENGINE_NAME } from './shared.ts'
import { store } from './store.ts'
import NvSettings from './NvSettings.vue'

const getCredentials = () => ({})
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
  category: 'cloud',
  getCredentials,
  hasCredentials() {
    return Object.values(getCredentials()).every(Boolean)
  },
  settingsComponent: NvSettings,
  getTranslationOptions,
  async translate(text, voiceLanguage) {
    const { ElectronTranslation } = window
    const { translateFrom, translateTo } = getTranslationOptions(voiceLanguage)
    try {
      return await ElectronTranslation.translate(text, {
        from: translateFrom,
        to: translateTo,
      })
    } catch (e) {
      return text
    }
  },
})
