import { ENGINE_ID, ENGINE_NAME } from '@/plugins/speech-recognition-engines/ibm-watson-speech-recognition/shared.ts'
import { store } from '@/plugins/speech-recognition-engines/ibm-watson-speech-recognition/store.ts'
import { SpeechRecognitionEngine } from '@/modules/speech-recognition-engine-manager/types.ts'

const getCredentials = () => ({
  apiKey: store.getProperty('apiKey', true),
  url: store.getProperty('url'),
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