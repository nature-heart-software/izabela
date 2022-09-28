<script lang="ts" setup>
import izabela from '@/modules/izabela'
import type { IzabelaMessagePayload } from '@/modules/izabela/types'
import { onIPCSay } from '@/electron/events/renderer'
import { useSpeechStore } from '@/features/speech/store'

onIPCSay((payload: string | IzabelaMessagePayload) => {
  console.log('saying something...')
  let message = null
  const speechStore = useSpeechStore()
  if (typeof payload === 'string') {
    const engine = speechStore.currentSpeechEngine
    if (!engine) return
    message = {
      message: payload,
      engine: engine.id,
      credentials: engine.getCredentials(),
      payload: engine.getPayload(payload),
    }
  } else {
    message = payload
  }
  izabela.say(message)
})
</script>
