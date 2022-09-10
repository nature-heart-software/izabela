import { api } from '@/services'
import { registerEngine } from '@/modules/speech-engine-manager'
import type { SpeechEngine } from '@/modules/speech-engine-manager/types'
import NvVoiceSelect from './NvVoiceSelect.vue'
import NvSettings from './NvSettings.vue'
import { ENGINE_ID, ENGINE_NAME } from './consts'
import { getProperty, setProperty } from './store'

const getCredentials = () => ({
  apiKey: getProperty('apiKey', true),
  region: getProperty('region'),
})

const commands: SpeechEngine['commands'] = (voice) =>
  (voice.StyleList || []).map((style: string) => ({ name: style, value: style }))

registerEngine({
  id: ENGINE_ID,
  name: ENGINE_NAME,
  getCredentials,
  hasCredentials() {
    return Object.values(getCredentials()).every(Boolean)
  },
  getPayload(text) {
    const voice = getProperty('selectedVoice')
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
    return {
      text: newText,
      voice: getProperty('selectedVoice'),
      expression,
    }
  },
  getLanguageCode() {
    return getProperty('selectedVoice').Locale
  },
  synthesizeSpeech({ credentials, payload }) {
    return api.post<Blob>(
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
