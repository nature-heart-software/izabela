import { definePluginStore } from '@/store'
import { defaultVoice, ENGINE_ID } from './shared'

export const store = definePluginStore(ENGINE_ID, {
  selectedVoice: {
    ...defaultVoice,
  },
  shortened: false,
  pitch: 1,
  favoriteVoiceIds: [],
  useCacheOnEveryRequest: true,
})

export const { setProperty, getProperty } = store
