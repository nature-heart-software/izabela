<script lang="ts" setup>
import izabela from '@/modules/izabela'
import type { IzabelaMessage } from '@/modules/izabela/types'
import { onIPCSay } from '@/electron/events/renderer'
import { useSpeechStore } from '@/features/speech/store'
import { getEngineById } from '@/modules/speech-engine-manager'

const speechStore = useSpeechStore()
const getCommand = (message: string) => {
  const command = message.split(' ')[0]
  if (command.startsWith('/')) return command.replace('/', '')
  return null
}

const cleanMessage = (message: string) => {
  const command = getCommand(message)
  if (command && !speechStore.engineCommands.find((c) => c.value === command))
    return message.replace(`/${command}`, '').trim()
  return message
}

onIPCSay((payload: string | IzabelaMessage) => {
  console.log('Saying something:', payload)
  let message = null
  if (typeof payload === 'string') {
    const engine = speechStore.currentSpeechEngine
    if (!engine) return
    message = {
      message: cleanMessage(payload),
      originalMessage: payload,
      engine: engine.id,
      voice: engine.getSelectedVoice(),
      credentials: engine.getCredentials(),
      payload: engine.getPayload(cleanMessage(payload)),
      command: getCommand(payload),
    }
  } else {
    const engine = getEngineById(payload.engine)
    if (!engine) return
    message = {
      ...payload,
      credentials: engine.getCredentials(),
      payload: engine.getPayload(payload.message, payload.voice),
    }
  }
  if (message) izabela.say(message)
})
</script>
