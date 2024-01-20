import { definePluginStore } from '@/store'
import { ENGINE_ID } from './shared'

export const { setProperty, getProperty } = definePluginStore(ENGINE_ID, {
  apiKey: '',
  url: '',
  selectedVoice: {
    gender: 'female',
    supported_features: {
      custom_pronunciation: true,
      voice_transformation: false,
    },
    name: 'en-US_AllisonV3Voice',
    customizable: true,
    description: 'Allison: American English female voice. Dnn technology.',
    language: 'en-US',
  },
  useLocalCredentials: false,
  favoriteVoiceIds: [],
})
