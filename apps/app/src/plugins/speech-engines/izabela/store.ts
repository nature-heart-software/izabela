import { definePluginStore } from '@/store'
import { ENGINE_ID } from './shared'

const exposedProperties = {
  selectedVoice: null,
}

export const store = definePluginStore(
  ENGINE_ID,
  {
    favoriteVoiceIds: [],
    useCacheOnEveryRequest: true,
    streamAudio: true,
    ...exposedProperties,
  },
  Object.keys(exposedProperties) as (keyof typeof exposedProperties)[],
)

export const { setProperty, getProperty } = store
