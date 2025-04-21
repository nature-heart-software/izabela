import { definePluginStore } from '@/store'

export const openaiSpeechRecognitionPlugin = definePluginStore(
  'openai-speech-recognition',
  {
    apiKey: '',
  },
)
