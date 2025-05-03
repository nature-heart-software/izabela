import { definePluginStore } from '@/store'
import { ENGINE_ID } from './shared.ts'

export const store = definePluginStore(ENGINE_ID, {
  apiKey: '',
  translateFrom: null,
  translateTo: null,
})
