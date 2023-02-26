<template>
  <div></div>
</template>
<script lang="ts" setup>
import { getTime } from '@/utils/time'
import { onBeforeUnmount } from 'vue'
import { getSoxMediaDeviceByIndex } from '@/utils/media-devices'
import {
  onIPCStartSpeechTranscription,
  onIPCStopSpeechTranscription,
} from '@/electron/events/renderer'
import { useSettingsStore } from '@/features/settings/store'
import hark from 'hark'
import { useSpeechRecognitionStore } from '@/features/speech/store'

let stream: MediaStream | null = null
let speech: ReturnType<typeof hark> | null = null
const settingsStore = useSettingsStore()
const speechRecognitionStore = useSpeechRecognitionStore()
const mediaDevice = await getSoxMediaDeviceByIndex(settingsStore.soxDevice)
const realTime = settingsStore.speechRecognitionStrategy === 'continuous'
const sampleRate = 48000
if (settingsStore.enableSTTTS) {
  if (realTime) {
    console.log('Starting web speech recognition...')
  } else {
    console.log('Starting push-to-record speech recognition...')
  }
  stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      deviceId: mediaDevice?.deviceId,
      sampleRate,
      sampleSize: 16,
      channelCount: 1,
    },
    video: false,
  })

  speech = hark(stream, {
    threshold: settingsStore.audioInputSensibility,
    interval: settingsStore.speechDetectionPolling,
  })

  speech.on('speaking', () => {
    console.log('Started speaking')
    speechRecognitionStore.$patch({
      recording: true,
    })
  })

  speech.on('stopped_speaking', () => {
    console.log('Stopped speaking')
    speechRecognitionStore.$patch({
      recording: false,
    })
  })
}

onIPCStartSpeechTranscription(() => {
  if (!realTime) {
    console.log(`[${ getTime() }] Starting web recording`)
    speechRecognitionStore.$patch({
      recording: true,
    })
  }
})

onIPCStopSpeechTranscription(() => {
  if (!realTime) {
    console.log(`[${ getTime() }] Stopping web recording`)
    speechRecognitionStore.$patch({
      recording: false,
    })
  }
})


onBeforeUnmount(() => {
  stream?.getTracks().forEach((track) => {
    if (track.readyState === 'live') {
      track.stop()
    }
  })
  speech?.stop()
  if (realTime) {
    console.log('Stopping web speech recognition...')
  } else {
    console.log('Stopping push-to-record speech recognition...')
  }
})
</script>
