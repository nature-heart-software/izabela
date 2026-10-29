import { api, fetchApi } from '@/services'
import { registerEngine } from '@/modules/speech-engine-manager'
import type { SpeechEngine } from '@/modules/speech-engine-manager/types'
import { useSpeechStore } from '@/features/speech/store'
import { defineAsyncComponent } from 'vue'
import { Credentials, ENGINE_ID, ENGINE_NAME, getVoiceName } from './shared'
import { getProperty, store } from './store'

const escapeXml = (value: string) =>
  value.replace(
    /[<>&"']/g,
    (character) =>
      ({
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;',
        '"': '&quot;',
        "'": '&apos;',
      }[character] as string),
  )

const getCredentials: SpeechEngine<Credentials>['getCredentials'] = () => {
  const speechStore = useSpeechStore()
  return speechStore.hasUniversalApiCredentials &&
    !getProperty('useLocalCredentials')
    ? {}
    : {
        apiKey:
          getProperty('apiKey', true) ||
          import.meta.env.VITE_SPEECH_ENGINE_MICROSOFT_AZURE_API_KEY,
        region:
          getProperty('region') ||
          import.meta.env.VITE_SPEECH_ENGINE_MICROSOFT_AZURE_REGION,
      }
}

const commands: SpeechEngine['commands'] = (voice) =>
  (voice?.StyleList || []).map((style: string) => ({
    name: style,
    value: style,
  }))

const getSelectedVoice = () => getProperty('selectedVoice')
export const engine = registerEngine({
  id: ENGINE_ID,
  name: ENGINE_NAME,
  category: 'cloud',
  getRegions: () =>
    api('remote')
      .get('/tts/microsoft-azure/list-regions')
      .then(({ data }) => data),
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
  getPayload({ text, translatedText, voice: v }) {
    const voice = v || getSelectedVoice()
    let newText = text
    let expression
    const commandString = newText.split(' ')[0] || ''
    if (commandString.startsWith('/')) {
      const command = commands(voice).find(({ name }) =>
        commandString.startsWith(`/${name}`),
      )
      newText = newText.replace(commandString, '')
      if (command) {
        expression = command.value
      }
    }
    const ssml = expression
      ? `<speak xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xmlns:emo="http://www.w3.org/2009/10/emotionml" version="1.0" xml:lang="en-US"><voice name="${escapeXml(
          voice.ShortName,
        )}"><mstts:express-as style="${escapeXml(expression)}">${escapeXml(
          translatedText || newText,
        )}</mstts:express-as></voice></speak>`
      : null
    return {
      ssml,
      text: translatedText || newText,
      voice: v || getSelectedVoice(),
    }
  },
  getLanguageCode(voice) {
    return (voice || getSelectedVoice()).Locale
  },
  synthesizeSpeech({ credentials, payload: { region, ...payload } }) {
    return fetchApi(
      getProperty('useLocalCredentials') ? 'local' : 'remote',
      `/tts/microsoft-azure/synthesize-speech${
        getProperty('streamAudio') ? '/stream' : ''
      }`,
      {
        method: 'POST',
        body: JSON.stringify({
          credentials,
          payload,
          includeTimestamps: getProperty('includeTimestamps'),
        }),
      },
      region,
    )
  },
  getUseCacheOnEveryRequest() {
    if (getProperty('includeTimestamps')) return false
    return getProperty('useCacheOnEveryRequest')
  },
  voiceSelectComponent: defineAsyncComponent(
    () => import('./NvVoiceSelect.vue'),
  ),
  settingsComponent: defineAsyncComponent(() => import('./NvSettings.vue')),
  commands,
  store,
})
