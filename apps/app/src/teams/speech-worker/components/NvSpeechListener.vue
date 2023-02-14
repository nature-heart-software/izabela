<template>
  <div></div>
</template>
<script lang="ts" setup>
import { getTime } from '@/utils/time'
import { blobToBase64 } from '@packages/toolbox'
import { onBeforeUnmount } from 'vue'
import { getMediaDeviceByLabel } from '@/utils/media-devices'
import {
  onIPCStartSpeechTranscription,
  onIPCStopSpeechTranscription,
} from '@/electron/events/renderer'
import { useSettingsStore } from '@/features/settings/store'
import hark from 'hark'
import { takeRight } from 'lodash'

let speaking = false
const realTime = true
const { ElectronSpeechWorkerWindow } = window
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

const options = {
  threshold: -60,
}
const speech = hark(stream.clone(), options)
speech.on('speaking', () => {
  console.log('speaking')

  if (realTime) {
    speaking = true
  }
})

speech.on('stopped_speaking', () => {
  console.log('stopped_speaking')

  if (realTime) {
    stopRecording()
  }
})

const onDataAvailable = (event: any) => {
  if (realTime && !speaking) {
    audioChunks = takeRight(audioChunks, 1)
  }
  audioChunks.push(event.data)
}

function stopRecording() {
  mediaRecorder?.stop()
  startRecording()
}

function startRecording() {
  mediaRecorder?.start()
  setTimeout(() => {
    if (!speaking) {
      stopRecording()
    }
  }, 300)
}

const onStop = () => {
  const audioBlob = new Blob(audioChunks, { type: mediaRecorder?.mimeType })
  audioChunks = []
  blobToBase64(audioBlob).then((base64) => {
    ElectronSpeechWorkerWindow.transcribeAudio({
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
mediaRecorder.addEventListener('stop', () => {
  if (speaking) {
    speaking = false
    onStop()
  }
})

onIPCStartSpeechTranscription(() => {
  if (!realTime) {
    console.log(`[${ getTime() }] Starting web recording`)
    mediaRecorder?.start()
  }
})

onIPCStopSpeechTranscription(() => {
  if (!realTime) {
    console.log(`[${ getTime() }] Stopping web recording`)
    mediaRecorder?.stop()
  }
})

if (realTime) {
  startRecording()
} else {
  speech?.stop()
}

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
  speech?.stop()
  mediaRecorder = null
})
</script>
