import { definePluginStore } from '@/store'
import { ENGINE_ID } from './shared'

export const { setProperty, getProperty } = definePluginStore(ENGINE_ID, {
  apiKey: '',
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
})
