import speechRecognitionEngineManager from '@/modules/speech-recognition-engine-manager'
import { ENGINE_ID } from './shared.ts'
import engineOptions from './engine-options.ts'
import NvSettings from './NvSettings.vue'

export default speechRecognitionEngineManager.registerEngine(ENGINE_ID, {
  ...engineOptions,
  settingsComponent: NvSettings,
})

