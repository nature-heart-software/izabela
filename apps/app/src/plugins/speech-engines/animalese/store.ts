import { definePluginStore } from '@/store'
import { defaultVoice, ENGINE_ID } from './shared'

const exposedProperties = {
  selectedVoice: {
    ...defaultVoice,
  },
  shortened: false,
  pitch: 1,
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
