import { definePluginStore } from '@/store'

export const amazonTranscribeSpeechRecognitionPlugin = definePluginStore(
  'amazon-transcribe-speech-recognition',
  {
    identityPoolId: '',
    region: '',
  },
)
