<template>
  <div></div>
</template>
<script lang="ts" setup>
import { getTime } from '@/utils/time'
import { blobToBase64 } from '@packages/toolbox'
import { onBeforeUnmount } from 'vue'
import { getMediaDeviceByLabel } from '@/utils/media-devices'
import {
  emitIPCTranscribeAudio,
  onIPCStartSpeechTranscription,
  onIPCStopSpeechTranscription,
} from '@/electron/events/renderer'
import { useSettingsStore } from '@/features/settings/store'

const settingsStore = useSettingsStore()
const mediaDevice = await getMediaDeviceByLabel(settingsStore.audioInput)
let audioChunks: Blob[] = []
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
