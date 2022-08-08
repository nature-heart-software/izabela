import { registerPluginStore } from '@/store'
import { ENGINE_ID } from './consts'

export const { setProperty, getProperty } = registerPluginStore(ENGINE_ID, {
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
  },
})
