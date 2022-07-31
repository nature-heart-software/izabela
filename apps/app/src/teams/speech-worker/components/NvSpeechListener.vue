<template>
  <div></div>
</template>
<script lang="ts" setup>
import store from '@/store'
import { getTime } from '@/utils/time'
import { blobToBase64 } from '@/utils/blob'
import { onBeforeUnmount } from 'vue'
import { getMediaDeviceByLabel } from '@/utils/media-devices'
import {
  emitIPCTranscribeAudio,
  onIPCStartSpeechTranscription,
  onIPCStopSpeechTranscription,
} from '@/electron/events/renderer'

const mediaDevice = await getMediaDeviceByLabel(
  store.getters['settings/persisted'].audioInputDevice,
)
let audioChunks: Blob[] = []
const { ipc } = window
const sampleRate = 48000
const stream = await navigator.mediaDevices.getUserMedia({
  audio: {
    deviceId: mediaDevice?.deviceId,
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
  const audioBlob = new Blob(audioChunks, { type: mediaRecorder?.mimeType })
  audioChunks = []
  blobToBase64(audioBlob).then((base64) => {
    emitIPCTranscribeAudio({
      content: (base64 as string).split(',').pop() || '',
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

onIPCStartSpeechTranscription(() => {
  if (mediaRecorder) {
    console.log(`[${ getTime() }] Starting web recording`)
    mediaRecorder.start()
  }
})

onIPCStopSpeechTranscription(() => {
  if (mediaRecorder) {
    console.log(`[${ getTime() }] Stopping web recording`)
    mediaRecorder.stop()
  }
})

onBeforeUnmount(() => {
  console.log('is this being called')
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
