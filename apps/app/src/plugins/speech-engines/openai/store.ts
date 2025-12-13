import { definePluginStore } from '@/store'
import { ENGINE_ID } from './shared'

const exposedProperties = {
  selectedVoice: null,
  instructions: '',
}

export const store = definePluginStore(
  ENGINE_ID,
  {
    apiKey: '',
    useLocalCredentials: false,
    favoriteVoiceIds: [],
    useCacheOnEveryRequest: true,
    streamAudio: true,
    useCommandDescriptionAsInstruction: true,
    ...exposedProperties,
  },
  Object.keys(exposedProperties) as (keyof typeof exposedProperties)[],
)

export const { setProperty, getProperty } = store
