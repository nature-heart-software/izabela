import {
  ENGINE_ID,
  ENGINE_NAME,
} from './shared.ts'
import { store } from './store.ts'
import { SpeechRecognitionEngine } from '@/modules/speech-recognition-engine-manager/types.ts'

const getCredentials = () => ({
  apiKey: store.getProperty('apiKey', true),
  region: store.getProperty('region'),
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