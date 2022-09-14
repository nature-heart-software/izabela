import { definePluginStore } from '@/store'
import { ENGINE_ID } from './consts'

export const { setProperty, getProperty } = definePluginStore(ENGINE_ID, {
  identityPoolId: '',
  region: '',
  selectedVoice: {
    Gender: 'Female',
    Id: 'Amy',
    LanguageCode: 'en-GB',
    LanguageName: 'British English',
    Name: 'Amy',
    SupportedEngines: ['neural', 'standard'],
  },
})
