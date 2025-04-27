import { definePluginStore } from '@/store'
import { ENGINE_ID } from './shared'

export const store = definePluginStore(ENGINE_ID, {
  selectedVoice: null,
  favoriteVoiceIds: [],
  useCacheOnEveryRequest: true,
  streamAudio: true,
})

export const { setProperty, getProperty } = store
