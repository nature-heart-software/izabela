import { definePluginStore } from '@/store'
import { ENGINE_ID } from './shared'

const exposedProperties = {
  selectedVoice: null,
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
