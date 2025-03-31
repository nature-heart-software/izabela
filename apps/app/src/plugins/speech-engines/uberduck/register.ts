import { api } from '@/services'
import { registerEngine } from '@/modules/speech-engine-manager'
import { useSpeechStore } from '@/features/speech/store'
import { DEFAULT_LANGUAGE_CODE } from '@/consts'
import NvVoiceSelect from './NvVoiceSelect.vue'
import NvSettings from './NvSettings.vue'
import { ENGINE_ID, ENGINE_NAME, getVoiceName } from './shared'
import { getProperty, setProperty } from './store'
import {
  axiosBlobResponseToBlob,
  axiosStreamResponseToMediaSource,
} from '@/utils/fetch.ts'

const getCredentials = () => ({
  publicKey: getProperty('publicKey', true),
  privateKey: getProperty('privateKey', true),
})

const getSelectedVoice = () => getProperty('selectedVoice')
registerEngine({
  id: ENGINE_ID,
  name: ENGINE_NAME,
  category: 'cloud',
  getSelectedVoice,
  getVoiceName,
  getCredentials,
  hasCredentials() {
    const speechStore = useSpeechStore()
    return (
      speechStore.hasUniversalApiCredentials ||
      Object.values(getCredentials()).every(Boolean)
    )
  },
  getPayload({ text, translatedText, voice }) {
    return {
      speech: translatedText || text,
      voicemodel_uuid: (voice || getSelectedVoice()).voicemodel_uuid,
    }
  },
  getLanguageCode() {
    return DEFAULT_LANGUAGE_CODE
  },
  synthesizeSpeech({ credentials, payload }) {
    const speechStore = useSpeechStore()
    return (
      api(getProperty('useLocalCredentials') ? 'local' : 'remote')
        .post(
          `/tts/uberduck/synthesize-speech${speechStore.streamAudio ? '/stream' : ''}`,
          {
            credentials,
            payload,
          },
          { responseType: speechStore.streamAudio ? 'stream' : 'blob' },
        )
        // @ts-ignore
        .then(
          speechStore.streamAudio
            ? axiosStreamResponseToMediaSource
            : axiosBlobResponseToBlob,
        )
    )
  },
  voiceSelectComponent: NvVoiceSelect,
  settingsComponent: NvSettings,
  store: { setProperty, getProperty },
})
