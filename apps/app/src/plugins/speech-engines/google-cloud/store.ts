import { definePluginStore } from '@/store'
import { ENGINE_ID } from './consts'

export const { setProperty, getProperty } = definePluginStore(ENGINE_ID, {
  apiKey: '',
  selectedVoice: {
    languageCodes: ['en-GB'],
    ssmlGender: 'FEMALE',
    name: 'en-GB-Wavenet-A',
  },
})
