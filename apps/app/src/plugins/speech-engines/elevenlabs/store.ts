import { definePluginStore } from '@/store'
import { ENGINE_ID } from './shared'

const exposedProperties = {
  selectedVoice: {
    voice_id: 'MF3mGyEYCl7XYWbV9V6O',
    name: 'Elli (american, clear)',
    samples: [],
    category: 'dynamic',
    preview_url:
      'https://storage.googleapis.com/eleven-public-prod/premade/voices/MF3mGyEYCl7XYWbV9V6O/bea2dc16-9abf-4162-b011-66531458e022.mp3',
    available_for_tiers: [],
    settings: null,
  },
  model_id: 'eleven_multilingual_v2',
  stability: 0.5,
  similarity_boost: 0.75,
  style: 0,
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
