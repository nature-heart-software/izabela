import { definePluginStore } from '@/store'
import { ENGINE_ID } from './shared'

const exposedProperties = {
  selectedVoice: null,
  additionalData: '',
}

export const store = definePluginStore(
  ENGINE_ID,
  {
    endpoint: '',
    apiKey: '',
    favoriteVoiceIds: [],
    useCacheOnEveryRequest: true,
    streamAudio: false,
    includeTimestamps: false,
    ...exposedProperties,
  },
  Object.keys(exposedProperties) as (keyof typeof exposedProperties)[],
)

export const { setProperty, getProperty } = store
