import { api } from '@/services'
import { registerEngine } from '@/modules/speech-engine-manager'
import type { SpeechEngine } from '@/modules/speech-engine-manager/types'
import { useSpeechStore } from '@/features/speech/store'
import NvVoiceSelect from './NvVoiceSelect.vue'
import NvSettings from './NvSettings.vue'
import { ENGINE_ID, ENGINE_NAME, getVoiceName } from './shared'
import { getProperty, setProperty } from './store'

const getCredentials = () => ({
  apiKey: getProperty('apiKey', true),
  region: getProperty('region'),
})

const commands: SpeechEngine['commands'] = (voice) =>
  (voice.StyleList || []).map((style: string) => ({ name: style, value: style }))

const getSelectedVoice = () => getProperty('selectedVoice')
registerEngine({
  id: ENGINE_ID,
  name: ENGINE_NAME,
  getSelectedVoice,
  getVoiceName,
  getCredentials,
  hasCredentials() {
    const speechStore = useSpeechStore()
    return speechStore.hasUniversalApiCredentials || Object.values(getCredentials()).every(Boolean)
  },
  getPayload(text, v) {
    const voice = v || getSelectedVoice()
    let newText = text
    let expression
    const commandString = newText.split(' ')[0] || ''
    if (commandString.startsWith('/')) {
      const command = commands(voice).find(({ name }) => commandString.startsWith(`/${name}`))
      newText = newText.replace(commandString, '')
      if (command) {
        expression = command.value
      }
    }
    const ssml = expression
      ? `<speak xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xmlns:emo="http://www.w3.org/2009/10/emotionml" version="1.0" xml:lang="en-US"><voice name="${voice.ShortName}"><mstts:express-as style="${expression}">${newText}</mstts:express-as></voice></speak>`
      : null
    return {
      ssml,
      text: newText,
      voice: v || getSelectedVoice(),
    }
  },
  getLanguageCode() {
    return getSelectedVoice().Locale
  },
  synthesizeSpeech({ credentials, payload }) {
    return api().post<Blob>(
      '/tts/microsoft-azure/synthesize-speech',
      {
        credentials,
        payload,
      },
      { responseType: 'blob' },
    )
  },
  voiceSelectComponent: NvVoiceSelect,
  settingsComponent: NvSettings,
  commands,
  store: {
    setProperty,
    getProperty,
  },
})
