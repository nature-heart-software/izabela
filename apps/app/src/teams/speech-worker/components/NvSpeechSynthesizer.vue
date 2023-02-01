<script lang="ts" setup>
import izabela from '@/modules/izabela'
import type { IzabelaMessage } from '@/modules/izabela/types'
import { onIPCSay } from '@/electron/events/renderer'
import { useSpeechStore } from '@/features/speech/store'
import { getEngineById } from '@/modules/speech-engine-manager'
import { getCleanMessage, getMessageCommand } from '@/modules/izabela/utils'


const speechStore = useSpeechStore()
onIPCSay((payload: string | IzabelaMessage) => {
  console.log('Saying something:', payload)
  let message = null
  if (typeof payload === 'string') {
    const engine = speechStore.currentSpeechEngine
    if (!engine) return
    const voice = engine.getSelectedVoice()
    const engineCommands = engine.commands?.(voice) || []
    const cleanMessage = getCleanMessage(payload, engineCommands)
    message = {
      voice,
      message: cleanMessage,
      originalMessage: payload,
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
