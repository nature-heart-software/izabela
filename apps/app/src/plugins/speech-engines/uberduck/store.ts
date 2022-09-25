import { definePluginStore } from '@/store'
import { ENGINE_ID } from './consts'

export const { setProperty, getProperty } = definePluginStore(ENGINE_ID, {
  publicKey: '',
  privateKey: '',
  selectedVoice: {
    architecture: 'tacotron2',
    category: 'Portal',
    contributors: ['scruffygamer'],
    controls: false,
    display_name: 'GLaDOS (Portal 2) (Crust)',
    is_active: true,
    model_id: '89b07ed5-3b04-4e4d-a2c6-0e36f54ef412',
    memberships: [],
    is_private: false,
    is_primary: true,
    name: 'glados-p2',
    symbol_set: 'nvidia_taco2',
    voicemodel_uuid: '42b79bb6-0b41-44dd-9824-e840d336c343',
    hifi_gan_vocoder: 'talknet/talknet-glados-talknet-2021-08-18/hifiganmodel',
    ml_model_id: 7943,
    speaker_id: 0,
    language: 'english',
  },
})
