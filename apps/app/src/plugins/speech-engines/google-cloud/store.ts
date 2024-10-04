import { definePluginStore } from '@/store'
import { ENGINE_ID } from './shared'

export const { setProperty, getProperty } = definePluginStore(ENGINE_ID, {
  apiKey: '',
  selectedVoice: {
    languageCodes: ['en-GB'],
    ssmlGender: 'FEMALE',
    name: 'en-GB-Wavenet-A',
  },
  useLocalCredentials: false,
  favoriteVoiceIds: [],
  speakingRate: 1,
  pitch: 0,
  volumeGainDb: 0,
})
