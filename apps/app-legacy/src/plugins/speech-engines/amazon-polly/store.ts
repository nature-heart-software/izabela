import { definePluginStore } from '@/store'
import { ENGINE_ID } from './shared'

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
  favoriteVoiceIds: [],
  useLocalCredentials: false,
})
