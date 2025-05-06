import { SpeechRecognitionEngine } from './types'
import { createEngineManager } from '@/modules/engine-manager'

const SpeechRecognitionEngineManager = () =>
  createEngineManager<SpeechRecognitionEngine>()
const instance = SpeechRecognitionEngineManager()
export default instance
