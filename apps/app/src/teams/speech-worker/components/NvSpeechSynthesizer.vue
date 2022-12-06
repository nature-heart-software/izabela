<script lang="ts" setup>
import izabela from '@/modules/izabela'
import type { IzabelaMessage } from '@/modules/izabela/types'
import { onIPCSay } from '@/electron/events/renderer'
import { useSpeechStore } from '@/features/speech/store'
import { getEngineById } from '@/modules/speech-engine-manager'

onIPCSay((payload: string | IzabelaMessage) => {
  console.log('Saying something:', payload)
  let message = null
  const speechStore = useSpeechStore()
  if (typeof payload === 'string') {
    const engine = speechStore.currentSpeechEngine
    if (!engine) return
    message = {
      message: payload,
      engine: engine.id,
      voice: engine.getSelectedVoice(),
      credentials: engine.getCredentials(),
      payload: engine.getPayload(payload),
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
