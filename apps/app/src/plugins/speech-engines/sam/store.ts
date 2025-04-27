import { definePluginStore } from '@/store'
import { defaultVoice, ENGINE_ID } from './shared'

export const store = definePluginStore(ENGINE_ID, {
  selectedVoice: {
    ...defaultVoice,
  },
  speed: 72,
  pitch: 64,
  throat: 128,
  mouth: 128,
  favoriteVoiceIds: [],
  useCacheOnEveryRequest: true,
})

export const { setProperty, getProperty } = store
