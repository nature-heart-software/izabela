import { definePluginStore } from '@/store'
import { ENGINE_ID } from './shared'

const exposedProperties = {
  selectedVoice: null,
  model_id: 'eleven_multilingual_v2',
  stability: 0.5,
  similarity_boost: 0.75,
  style: 0,
  speed: 1,
  use_speaker_boost: true,
}

export const store = definePluginStore(
  ENGINE_ID,
  {
    apiKey: '',
    favoriteVoiceIds: [],
    stream: true,
    useCacheOnEveryRequest: true,
    streamAudio: true,
    includeTimestamps: false,
    ...exposedProperties,
  },
  Object.keys(exposedProperties) as (keyof typeof exposedProperties)[],
)

export const { setProperty, getProperty } = store
