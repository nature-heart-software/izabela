<script lang="ts" setup>
import izabela from '@/modules/izabela'
import type { IzabelaMessage } from '@/modules/izabela/types'
import {
  onIPCCancelAllMessages,
  onIPCCancelCurrentMessage,
  onIPCSay,
} from '@/electron/events/renderer'
import { useSpeechStore } from '@/features/speech/store'
import { getEngineById } from '@/modules/speech-engine-manager'
import {
  getCleanMessage,
  getMessageCommand,
  removeCommandFromMessage,
} from '@/modules/izabela/utils'
import { useSettingsStore } from '@/features/settings/store'
import { io } from 'socket.io-client'

const { ElectronTranslation } = window
const speechStore = useSpeechStore()
const settingsStore = useSettingsStore()
const socket = io(`ws://localhost:${process.env.VUE_APP_SERVER_WS_PORT}`, {})
const onMessage = async (payload: string | IzabelaMessage) => {
  console.log('Saying something:', payload)
  let message = null
  if (typeof payload === 'string') {
    const engine = speechStore.currentSpeechEngine
    if (!engine) return
    const voice = engine.getSelectedVoice()
    const engineCommands = engine.commands?.(voice) || []
    const cleanMessage = getCleanMessage(payload, engineCommands)
    const translatedMessage = settingsStore.enableTranslation
      ? await ElectronTranslation.translate(removeCommandFromMessage(payload), {
          from: settingsStore.textInputLanguage || undefined,
          to: settingsStore.textOutputLanguage || engine.getLanguageCode(voice),
        })
      : null
    console.log('Translated message:', translatedMessage)
    message = {
      voice,
      message: cleanMessage,
      originalMessage: payload,
      translatedMessage,
      translatedFrom: settingsStore.textInputLanguage,
      translatedTo: settingsStore.textOutputLanguage,
      engine: engine.id,
      credentials: engine.getCredentials(),
      payload: engine.getPayload({
        voice,
        translatedText: translatedMessage,
        text: cleanMessage,
      }),
      command: getMessageCommand(payload),
    }
  } else {
    const engine = getEngineById(payload.engine)
    if (!engine) return
    const { voice } = payload
    const engineCommands = engine.commands?.(voice) || []
    const cleanMessage = getCleanMessage(payload.message, engineCommands)
    message = {
      ...payload,
      credentials: engine.getCredentials(),
      payload: engine.getPayload({
        voice,
        translatedText: payload.translatedMessage,
        text: cleanMessage,
      }),
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
