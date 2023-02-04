import { definePluginStore } from '@/store'
import { ENGINE_ID } from './shared'

export const { setProperty, getProperty } = definePluginStore(ENGINE_ID, {
  apiKey: '',
  selectedVoice: {
    voice_id: '21m00Tcm4TlvDq8ikWAM',
    name: 'Rachel (american, mellow)',
    samples: [],
    category: 'conversational',
    preview_url:
      'https://storage.googleapis.com/eleven-public-prod/premade/voices/21m00Tcm4TlvDq8ikWAM/dff5d82d-d16d-45b9-ae73-be2ad8850855.mp3',
    available_for_tiers: [],
    settings: null,
  },
})
