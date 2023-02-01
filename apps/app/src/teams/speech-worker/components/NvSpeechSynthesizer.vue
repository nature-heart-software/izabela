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
    message = {
      message: getCleanMessage(payload, engine.commands?.(engine.getSelectedVoice()) || []),
      originalMessage: payload,
      engine: engine.id,
      voice: engine.getSelectedVoice(),
      credentials: engine.getCredentials(),
      payload: engine.getPayload(getCleanMessage(payload, engine.commands?.(engine.getSelectedVoice()) || [])),
      command: getMessageCommand(payload),
    }
  } else {
    const engine = getEngineById(payload.engine)
    if (!engine) return
    message = {
      ...payload,
      credentials: engine.getCredentials(),
      payload: engine.getPayload(getCleanMessage(payload.message, engine.commands?.(payload.voice) || []), payload.voice),
    }
  }
  if (message) izabela.say(message)
})
</script>
