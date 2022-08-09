<script lang="ts" setup>
import izabela from '@/modules/izabela'
import type { IzabelaMessagePayload } from '@/modules/izabela/types'
import store from '@/store'
import { onIPCSay } from '@/electron/events/renderer'

onIPCSay((payload: string | IzabelaMessagePayload) => {
  console.log('saying something...')
  let message = null
  if (typeof payload === 'string') {
    const engine = store.getters['speech/currentSpeechEngine']
    if (!engine) return
    message = {
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
