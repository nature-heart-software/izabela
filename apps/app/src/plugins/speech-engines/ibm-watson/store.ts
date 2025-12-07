import { definePluginStore } from '@/store'
import { ENGINE_ID } from './shared'

const exposedProperties = {
  selectedVoice: null,
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
