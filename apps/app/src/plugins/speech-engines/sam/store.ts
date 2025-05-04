import { definePluginStore } from '@/store'
import { defaultVoice, ENGINE_ID } from './shared'

const exposedProperties = {
  selectedVoice: {
    ...defaultVoice,
  },
  speed: 72,
  pitch: 64,
  throat: 128,
  mouth: 128,
}

export const store = definePluginStore(
  ENGINE_ID,
  {
    favoriteVoiceIds: [],
    useCacheOnEveryRequest: true,
    ...exposedProperties,
  },
  Object.keys(exposedProperties) as (keyof typeof exposedProperties)[],
)

export const { setProperty, getProperty } = store
