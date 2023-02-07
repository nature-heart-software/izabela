import { definePluginStore } from '@/store'
import { ENGINE_ID } from './shared'

export const { setProperty, getProperty } = definePluginStore(ENGINE_ID, {
  apiKey: '',
  region: '',
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
  useLocalCredentials: false,
})
