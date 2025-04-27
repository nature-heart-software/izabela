import { definePluginStore } from '@/store'
import { ENGINE_ID } from './shared'

export const store = definePluginStore(ENGINE_ID, {
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
  useCacheOnEveryRequest: true,
  streamAudio: true,
  includeTimestamps: false,
})

export const { getProperty, setProperty } = store
