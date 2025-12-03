import { store } from './store.ts'
import { SpeechRecognitionEngine } from '@/modules/speech-recognition-engine-manager/types.ts'
import { ENGINE_ID, ENGINE_NAME } from './shared.ts'

const getCredentials: SpeechRecognitionEngine['getCredentials'] = () => ({
  identityPoolId:
    store.getProperty('identityPoolId', true) ||
    import.meta.env
      .VITE_SPEECH_RECOGNITION_ENGINE_AMAZON_TRANSCRIBE_IDENTITY_POOL_ID,
  region:
    store.getProperty('region') ||
    import.meta.env.VITE_SPEECH_RECOGNITION_ENGINE_AMAZON_TRANSCRIBE_ENDPOINT,
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
