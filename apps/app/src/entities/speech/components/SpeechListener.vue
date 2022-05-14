<script lang="ts" setup>
import { useStore } from 'vuex'
import { onBeforeUnmount } from 'vue'
import izabela from '@/modules/izabela'
import speechEngineManager from '@/entities/speech/modules/speech-engine-manager'
// import WebSocket from 'ws'

const store = useStore()
const sampleRate = 16000
const stream = navigator.mediaDevices.getUserMedia({
  audio: {
    deviceId: store.getters['settings/persisted'].audioInputDevice,
    sampleRate,
    sampleSize: 16,
    channelCount: 1,
  },
  video: false,
})
const audioContext = new window.AudioContext({ sampleRate })
const source: MediaStreamAudioSourceNode = audioContext.createMediaStreamSource(await stream)
await audioContext.audioWorklet.addModule('./pcm-worker.js')
const pcmWorker = new AudioWorkletNode(audioContext, 'pcm-worker', {
  outputChannelCount: [1],
})
source.connect(pcmWorker)

const conn = new WebSocket('ws://127.0.0.1:1243')
pcmWorker.port.onmessage = (event) => {
  if (conn.readyState === conn.OPEN) {
    conn.send(event.data)
  }
}

conn.onmessage = ({ data: message }) => {
  if (message) {
    const engine = speechEngineManager.getEngineById(
      store.getters['settings/persisted'].selectedSpeechEngine,
    )
    if (!engine) return
    izabela.say({
      engine: engine.id,
      credentials: engine.getCredentials(),
      payload: engine.getPayload(message),
    })
  }
}

pcmWorker.port.start()
onBeforeUnmount(() => {
  pcmWorker.port.close()
  conn.close()
  source.disconnect()
  audioContext.close()
})
</script>
