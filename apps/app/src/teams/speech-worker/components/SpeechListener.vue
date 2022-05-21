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
let mediaRecorder: MediaRecorder | null = new MediaRecorder(stream)

const onDataAvailable = (event: any) => {
  audioChunks.push(event.data)
}

const onStop = () => {
  console.log(audioChunks)
  const audioBlob = new Blob(audioChunks, { type: mediaRecorder?.mimeType })
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
}

mediaRecorder.addEventListener('dataavailable', onDataAvailable)
mediaRecorder.addEventListener('stop', onStop)

ipc.on('main', 'start-speech-transcription', () => {
  if (mediaRecorder) {
    console.log(`[${getTime()}] Starting web recording`)
    mediaRecorder.start()
  }
})

ipc.on('main', 'stop-speech-transcription', () => {
  if (mediaRecorder) {
    console.log(`[${getTime()}] Stopping web recording`)
    mediaRecorder.stop()
  }
})

onBeforeUnmount(() => {
  if (mediaRecorder?.state !== 'inactive') {
    mediaRecorder?.stop()
  }
  mediaRecorder?.removeEventListener('dataavailable', onDataAvailable)
  mediaRecorder?.removeEventListener('stop', onDataAvailable)
  stream.getTracks().forEach((track) => {
    if (track.readyState === 'live') {
      track.stop()
    }
  })
  mediaRecorder = null
})
</script>
