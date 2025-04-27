import { definePluginStore } from '@/store'
import { ENGINE_ID } from './shared'

export const store = definePluginStore(ENGINE_ID, {
  selectedVoice: null,
  speed: 100,
  favoriteVoiceIds: [],
  useCacheOnEveryRequest: true,
})

export const { setProperty, getProperty } = store
