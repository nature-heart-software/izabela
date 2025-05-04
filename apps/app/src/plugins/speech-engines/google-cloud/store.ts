import { definePluginStore } from '@/store'
import { ENGINE_ID } from './shared'

const exposedProperties = {
  selectedVoice: {
    languageCodes: ['en-GB'],
    ssmlGender: 'FEMALE',
    name: 'en-GB-Wavenet-A',
  },
  speakingRate: 1,
  pitch: 0,
  volumeGainDb: 0,
}

export const store = definePluginStore(
  ENGINE_ID,
  {
    apiKey: '',
    useLocalCredentials: false,
    favoriteVoiceIds: [],
    useCacheOnEveryRequest: true,
    streamAudio: true,
    ...exposedProperties,
  },
  Object.keys(exposedProperties) as (keyof typeof exposedProperties)[],
)

export const { setProperty, getProperty } = store
