import { definePluginStore } from '@/store'
import { ENGINE_ID } from './consts'

export const { setProperty, getProperty } = definePluginStore(ENGINE_ID, {
  selectedVoice: null,
})
