import { definePluginStore } from '@/store'

export const microsoftAzureSpeechRecognitionPlugin = definePluginStore(
  'microsoft-azure-speech-recognition',
  {
    apiKey: '',
    region: '',
  },
)
