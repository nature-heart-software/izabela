import { ENGINE_ID, ENGINE_NAME } from './shared.ts'
import { store } from './store.ts'
import { SpeechRecognitionEngine } from '@/modules/speech-recognition-engine-manager/types.ts'

const getCredentials = () => ({
  apiKey:
    store.getProperty('apiKey', true) ||
    import.meta.env.VITE_SPEECH_RECOGNITION_ENGINE_MICROSOFT_AZURE_API_KEY,
  region:
    store.getProperty('region') ||
    import.meta.env.VITE_SPEECH_RECOGNITION_ENGINE_MICROSOFT_AZURE_REGION,
})
export default {
  id: ENGINE_ID,
  name: ENGINE_NAME,
  store,
  category: 'cloud',
  getCredentials,
  hasCredentials() {
    return Object.values(getCredentials()).every(Boolean)
  },
} as SpeechRecognitionEngine
