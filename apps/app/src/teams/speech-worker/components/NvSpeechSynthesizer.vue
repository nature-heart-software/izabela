<script lang="ts" setup>
import izabela from '@/modules/izabela'
import type { IzabelaMessage } from '@/modules/izabela/types'
import { onIPCSay } from '@/electron/events/renderer'
import { useSpeechStore } from '@/features/speech/store'
import { getEngineById } from '@/modules/speech-engine-manager'
import { getCleanMessage, getMessageCommand } from '@/modules/izabela/utils'
import { useSettingsStore } from '@/features/settings/store'

const { ElectronTranslation } = window
const speechStore = useSpeechStore()
const settingsStore = useSettingsStore()
onIPCSay(async (payload: string | IzabelaMessage) => {
  console.log('Saying something:', payload)
  let message = null
  if (typeof payload === 'string') {
    const engine = speechStore.currentSpeechEngine
    if (!engine) return
    const voice = engine.getSelectedVoice()
    const engineCommands = engine.commands?.(voice) || []
    const cleanMessage = getCleanMessage(payload, engineCommands)
    const translatedMessage = settingsStore.enableTranslation ? await ElectronTranslation.translate(cleanMessage, {
      from: settingsStore.textInputLanguage || undefined,
      to: settingsStore.textOutputLanguage,
    }) : cleanMessage
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
      payload: engine.getPayload(cleanMessage, voice),
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
      payload: engine.getPayload(cleanMessage, voice),
    }
  }
  if (message) izabela.say(message)
})
</script>
