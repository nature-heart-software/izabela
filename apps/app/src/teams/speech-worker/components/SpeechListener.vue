<script lang="ts" setup>
import store from '@/store'
import { getTime } from '@/utils/time'
import { blobToBase64 } from '@/utils/blob'
import { onBeforeUnmount } from 'vue'

let audioChunks: Blob[] = []
const { ipc } = window
const sampleRate = 48000
const stream = await navigator.mediaDevices.getUserMedia({
  audio: {
    deviceId: store.getters['settings/persisted'].audioInputDevice,
    sampleRate,
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
  const audioBlob = new Blob(audioChunks, { type: mediaRecorder.mimeType })
  audioChunks = []
  blobToBase64(audioBlob).then((base64) => {
    ipc.sendTo('main', 'transcribe-audio', {
      content: (base64 as string).split(',').pop(),
      sampleRate,
      encoding: 'WEBM_OPUS',
    })
  })

  // debug
  // const audioUrl = URL.createObjectURL(audioBlob)
  // const audio = new Audio(audioUrl)
  // audio.play()
})

ipc.on('main', 'start-speech-transcription', () => {
  console.log(`[${getTime()}] Starting web recording`)
  mediaRecorder.start()
})

ipc.on('main', 'stop-speech-transcription', () => {
  console.log(`[${getTime()}] Stopping web recording`)
  mediaRecorder.stop()
})

onBeforeUnmount(() => {
  if (mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop()
  }
})
</script>
