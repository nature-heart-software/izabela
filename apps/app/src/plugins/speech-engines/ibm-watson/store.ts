import { definePluginStore } from '@/store'
import { ENGINE_ID } from './shared'

const exposedProperties = {
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
  ratePercentage: 0,
  pitchPercentage: 0,
}

export const store = definePluginStore(
  ENGINE_ID,
  {
    apiKey: '',
    url: '',
    useLocalCredentials: false,
    favoriteVoiceIds: [],
    useCacheOnEveryRequest: true,
    streamAudio: true,
    includeTimestamps: false,
    ...exposedProperties,
  },
  Object.keys(exposedProperties) as (keyof typeof exposedProperties)[],
)

export const { setProperty, getProperty } = store
