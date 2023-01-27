import { definePluginStore } from '@/store'
import { defaultVoice, ENGINE_ID } from './shared'

export const { setProperty, getProperty } = definePluginStore(ENGINE_ID, {
  selectedVoice: {
    ...defaultVoice,
  },
  shortened: false,
  pitch: 1,
})
