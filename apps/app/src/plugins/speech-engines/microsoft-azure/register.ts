import { api } from '@/services'
import { registerEngine } from '@/modules/speech-engine-manager'
import type { SpeechEngine } from '@/modules/speech-engine-manager/types'
import NvVoiceSelect from './NvVoiceSelect.vue'
import NvSettings from './NvSettings.vue'
import { ENGINE_ID, ENGINE_NAME } from './consts'
import { getProperty } from './store'

const getCredentials = () => ({
  apiKey: getProperty('apiKey', true),
  region: getProperty('region'),
})

const commands: SpeechEngine['commands'] = [
  { name: 'assistant', value: 'assistant' },
  { name: 'chat', value: 'chat' },
  { name: 'customerservice', value: 'customerservice' },
  { name: 'newscast', value: 'newscast' },
  { name: 'cheerful', value: 'cheerful' },
  { name: 'sad', value: 'sad' },
  { name: 'excited', value: 'excited' },
  { name: 'friendly', value: 'friendly' },
  { name: 'terrified', value: 'terrified' },
  { name: 'shouting', value: 'shouting' },
  { name: 'unfriendly', value: 'unfriendly' },
  { name: 'whispering', value: 'whispering' },
  { name: 'hopeful', value: 'hopeful' },
]

registerEngine({
  id: ENGINE_ID,
  name: ENGINE_NAME,
  getCredentials,
  hasCredentials() {
    return Object.values(getCredentials()).every(Boolean)
  },
  getPayload(text) {
    let newText = text
    let expression
    if (newText.startsWith('/')) {
      const command = commands.find(({ name }) => newText.startsWith(`/${name}`))
      if (command) {
        newText = newText.replace(`/${command.name}`, '')
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
})
