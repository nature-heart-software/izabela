import { definePluginStore } from '@/store'
import { defaultVoice, ENGINE_ID } from './shared'

export const { setProperty, getProperty } = definePluginStore(ENGINE_ID, {
  selectedVoice: {
    ...defaultVoice,
  },
  speed: 72,
  speech: 64,
  throat: 128,
  mouth: 128,
})
