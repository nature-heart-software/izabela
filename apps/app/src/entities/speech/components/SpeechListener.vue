<script lang="ts" setup>
import store from '@/store'
import { getTime } from '@/utils/time'
import { blobToBase64 } from '@/utils/blob'
import { onBeforeUnmount } from 'vue'

let audioChunks: Blob[] = []
const { ipc } = window
const stream = await navigator.mediaDevices.getUserMedia({
  audio: {
    deviceId: store.getters['settings/persisted'].audioInputDevice,
    sampleRate: 16000,
    sampleSize: 16,
    channelCount: 1,
  },
  video: false,
})
const mediaRecorder = new MediaRecorder(stream)

mediaRecorder.addEventListener('dataavailable', (event) => {
  audioChunks.push(event.data)
})

mediaRecorder.addEventListener('stop', () => {
  const audioBlob = new Blob(audioChunks)
  audioChunks = []
  blobToBase64(audioBlob).then((base64) => {
    ipc.sendTo('main', 'transcribe-audio', base64)
  })

  const audioUrl = URL.createObjectURL(audioBlob)
  const audio = new Audio(audioUrl)
  audio.play()
})

ipc.on('main', 'speech-record-start', () => {
  console.log(`[${getTime()}] Starting web recording`)
  mediaRecorder.start()
})

ipc.on('main', 'speech-record-stop', () => {
  console.log(`[${getTime()}] Stopping web recording`)
  mediaRecorder.stop()
})

onBeforeUnmount(() => {
  if (mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop()
  }
})
</script>
