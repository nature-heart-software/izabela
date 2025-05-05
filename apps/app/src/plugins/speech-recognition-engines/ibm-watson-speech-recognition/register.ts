import speechRecognitionEngineManager from '@/modules/speech-recognition-engine-manager'
import { ENGINE_ID, ENGINE_NAME } from './shared.ts'
import { store } from './store.ts'
import NvSettings from './NvSettings.vue'
const getCredentials = () => ({
  apiKey: store.getProperty('apiKey', true),
  url: store.getProperty('url'),
})
speechRecognitionEngineManager.registerEngine(ENGINE_ID, {
  id: ENGINE_ID,
  name: ENGINE_NAME,
  store,
  category: 'cloud',
  getCredentials,
  hasCredentials() {
    return Object.values(getCredentials()).every(Boolean)
  },
  settingsComponent: NvSettings,
})
