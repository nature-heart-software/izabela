import { definePluginStore } from '@/store'

export const ibmWatsonSpeechRecognitionPlugin = definePluginStore(
  'ibm-watson-speech-recognition',
  {
      apiKey: '',
      url: '',
  },
)
