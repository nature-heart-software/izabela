import { definePluginStore } from '@/store'
import { ENGINE_ID } from './shared'

const exposedProperties = {
  selectedVoice: {
    Gender: 'Female',
    Id: 'Amy',
    LanguageCode: 'en-GB',
    LanguageName: 'British English',
    Name: 'Amy',
    SupportedEngines: ['neural', 'standard'],
  },
}

export const store = definePluginStore(
  ENGINE_ID,
  {
    identityPoolId: '',
    region: '',
    favoriteVoiceIds: [],
    useLocalCredentials: false,
    useCacheOnEveryRequest: true,
    streamAudio: true,
    includeTimestamps: false,
    ...exposedProperties,
  },
  Object.keys(exposedProperties) as (keyof typeof exposedProperties)[],
)

export const { getProperty, setProperty } = store
