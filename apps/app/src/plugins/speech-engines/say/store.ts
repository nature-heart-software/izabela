import { registerPluginStore } from '@/store'
import { ENGINE_ID } from './consts'

export const { setProperty, getProperty } = registerPluginStore(ENGINE_ID, {
  selectedVoice: null,
})
