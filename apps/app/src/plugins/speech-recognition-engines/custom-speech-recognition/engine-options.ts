import { ENGINE_ID, ENGINE_NAME } from '@/plugins/speech-recognition-engines/custom-speech-recognition/shared.ts'
import { store } from '@/plugins/speech-recognition-engines/custom-speech-recognition/store.ts'
import { SpeechRecognitionEngine } from '@/modules/speech-recognition-engine-manager/types.ts'

const getCredentials = () => ({
})
export default {
  id: ENGINE_ID,
  name: ENGINE_NAME,
  store,
  category: 'other',
  getCredentials,
  hasCredentials() {
    return Object.values(getCredentials()).every(Boolean)
  }
} as SpeechRecognitionEngine