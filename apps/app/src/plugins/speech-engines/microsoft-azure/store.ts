import { definePluginStore } from '@/store'
import { ENGINE_ID } from './shared'

const exposedProperties = {
  selectedVoice: {
    Name: 'Microsoft Server Speech Text to Speech Voice (en-US, AshleyNeural)',
    DisplayName: 'Ashley',
    LocalName: 'Ashley',
    ShortName: 'en-US-AshleyNeural',
    Gender: 'Female',
    Locale: 'en-US',
    SampleRateHertz: '24000',
    VoiceType: 'Neural',
    Status: 'GA',
    LocaleName: 'English (United States)',
    StyleList: [
      'angry',
      'cheerful',
      'excited',
      'friendly',
      'hopeful',
      'sad',
      'shouting',
      'terrified',
      'unfriendly',
      'whispering',
    ],
    WordsPerMinute: '149',
  },
}

export const store = definePluginStore(
  ENGINE_ID,
  {
    apiKey: '',
    region: '',
    useLocalCredentials: false,
    favoriteVoiceIds: [],
    useCacheOnEveryRequest: true,
    streamAudio: true,
    includeTimestamps: false,
    ...exposedProperties,
  },
  Object.keys(exposedProperties) as (keyof typeof exposedProperties)[],
)

export const { setProperty, getProperty } = store
