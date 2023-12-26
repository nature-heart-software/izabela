import { definePluginStore } from '@/store'
import { ENGINE_ID } from './shared'

export const { setProperty, getProperty } = definePluginStore(ENGINE_ID, {
  publicKey: '',
  privateKey: '',
  selectedVoice: {
    "added_at": null,
    "architecture": "talknet",
    "category": "Speaking",
    "contributors": [
      "sam-koelle",
    ],
    "controls": false,
    "display_name": "Carolyn",
    "is_active": true,
    "memberships": [
      {
        "name": "creator",
        "id": 1,
      },
    ],
    "is_private": false,
    "is_primary": true,
    "name": "carolyn-speaking",
    "symbol_set": "nvidia_taco2",
    "voicemodel_uuid": "60c910d0-d924-4f74-a47c-6c9e44e2bb8b",
    "hifi_gan_vocoder": "talknet/talknet-carolyn-2022-03-13/hifiganmodel",
    "ml_model_id": 6610,
    "speaker_id": null,
    "language": "english",
    "gender": "",
    "mood": "",
    "style": "",
    "accent": "",
    "age": "",
    "description": "",
    "image_url": "https://uberduck-images.s3.amazonaws.com/commercial/carolyn.png",
  },
  useLocalCredentials: false,
  favoriteVoiceIds: [],
})
