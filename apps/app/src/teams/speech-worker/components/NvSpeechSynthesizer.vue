<script lang="ts" setup>
import izabela from '@/modules/izabela'
import type { IzabelaMessage, IzabelaMessagePayload } from '@/modules/izabela/types'
import {
  onIPCCancelAllMessages,
  onIPCCancelCurrentMessage,
  onIPCSay,
} from '@/electron/events/renderer'
import { useSpeechStore } from '@/features/speech/store'
import speechEngineManager from '@/modules/speech-engine-manager'
import translationEngineManager from '@/modules/translation-engine-manager'
import {
  getCleanMessage,
  getMessageCommand,
  removeCommandFromMessage,
} from '@/modules/izabela/utils'
import { useSettingsStore } from '@/features/settings/store'
import { io } from 'socket.io-client'

const speechStore = useSpeechStore()
const settingsStore = useSettingsStore()
const socket = io(`ws://localhost:${import.meta.env.VITE_SERVER_WS_PORT}`, {})

const onMessage = async (payload: string | IzabelaMessage) => {
  console.log('Saying something:', payload)
  let message: IzabelaMessagePayload | null = null
  if (typeof payload === 'string') {
    const speechEngine = speechStore.currentSpeechEngine
    const translationEngine = translationEngineManager.getEngineById(
      settingsStore.selectedTranslationEngine,
    )
    if (!speechEngine) return
    const voice = speechEngine.getSelectedVoice()
    const engineCommands = speechEngine.commands?.(voice) || []
    const command = getMessageCommand(payload)
    const customCommand = speechStore.customCommands.find(e => e.value === command)
    const cleanMessage = getCleanMessage(payload, engineCommands)
    const voiceLanguageCode = speechEngine.getLanguageCode(voice)
    const translationOptions =
      translationEngine?.getTranslationOptions(voiceLanguageCode)
    const translatedMessage =
      settingsStore.enableTranslation && translationEngine
        ? await translationEngine.translate(
            removeCommandFromMessage(payload),
            voiceLanguageCode,
          )
        : null
    console.log('Translated message:', translatedMessage)
    message = {
      voice,
      message: cleanMessage,
      originalMessage: payload,
      translatedMessage,
      translatedFrom: translationOptions?.translateFrom || null,
      translatedTo: translationOptions?.translateTo || null,
      engine: speechEngine.id,
      credentials: speechEngine.getCredentials(),
      payload: speechEngine.getPayload({
        voice,
        translatedText: translatedMessage,
        text: cleanMessage,
        command,
      }),
      command,
      customCommand,
    }
  } else {
    const engine = speechEngineManager.getEngineById(payload.engine)
    if (!engine) return
    const { voice } = payload
    const engineCommands = engine.commands?.(voice) || []
    const cleanMessage = getCleanMessage(payload.message, engineCommands)
    const command = payload.command
    const customCommand = speechStore.customCommands.find(e => e.value === payload.command)
    message = {
      ...payload,
      credentials: engine.getCredentials(),
      payload: engine.getPayload({
        voice,
        translatedText: payload.translatedMessage,
        text: cleanMessage,
        command,
      }),
      command,
      customCommand,
    }
  }
  if (message) izabela.say(message)
}
socket.on('say', (e) => {
  if (typeof e === 'string') onMessage(e)
})
onIPCSay(onMessage)
onIPCCancelCurrentMessage(() => {
  izabela.endCurrentMessage()
})
onIPCCancelAllMessages(() => {
  izabela.endAllMessages()
})
</script>
