<script lang="ts" setup>
import izabela from '@/modules/izabela'
import type { IzabelaMessagePayload } from '@/modules/izabela/types'
import speechEngineManager from '@/entities/speech/modules/speech-engine-manager'
import store from '@/store'
import { processes } from '@/types/electron'

const { ipc } = window

processes.forEach((processName) => {
  ipc.on(processName, 'say', (payload: string | IzabelaMessagePayload) => {
    console.log('saying something...')
    let message = null
    if (typeof payload === 'string') {
      const engine = speechEngineManager.getEngineById(
        store.getters['settings/persisted'].selectedSpeechEngine,
      )
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
})
</script>
