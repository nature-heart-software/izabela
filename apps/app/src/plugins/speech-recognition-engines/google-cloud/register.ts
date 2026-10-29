import speechRecognitionEngineManager from '@/modules/speech-recognition-engine-manager'
import { ENGINE_ID } from './shared.ts'
import engineOptions from './engine-options.ts'
import { defineAsyncComponent } from 'vue'

export default speechRecognitionEngineManager.registerEngine(ENGINE_ID, {
  ...engineOptions,
  settingsComponent: defineAsyncComponent(() => import('./NvSettings.vue')),
})
