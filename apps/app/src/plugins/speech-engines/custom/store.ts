import { definePluginStore } from '@/store'
import { ENGINE_ID } from './shared'

export const store = definePluginStore(ENGINE_ID, {
  selectedVoice: null,
  endpoint: '',
  apiKey: '',
  favoriteVoiceIds: [],
  useCacheOnEveryRequest: true,
  streamAudio: false,
  includeTimestamps: false,
})

export const { setProperty, getProperty } = store
