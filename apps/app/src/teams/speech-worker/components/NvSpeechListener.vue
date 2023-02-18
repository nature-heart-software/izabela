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
let audioChunks: Blob[] = []
let stream: MediaStream | null = null
let speech: ReturnType<typeof hark> | null = null
let mediaRecorder: MediaRecorder | null = null
const { ElectronSpeechWorkerWindow } = window
const settingsStore = useSettingsStore()
const mediaDevice = await getMediaDeviceByLabel(settingsStore.audioInput)
const realTime = settingsStore.speechRecognitionStrategy === 'continuous-web'
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

  speech = hark(stream.clone(), {
    threshold: settingsStore.audioInputSensibility,
    interval: settingsStore.speechPostrecordTime,
  })

  speech.on('speaking', () => {
    console.log('Started speaking')

    if (realTime) {
      speaking = true
    }
  })

  speech.on('stopped_speaking', () => {
    console.log('Stopped speaking')

    if (realTime) {
      stopRecording()
    }
  })

  mediaRecorder = stream ? new MediaRecorder(stream) : null

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

  mediaRecorder?.addEventListener('dataavailable', onDataAvailable)
  mediaRecorder?.addEventListener('stop', () => {
    if (speaking) {
      speaking = false
      onStop()
    }
    if (!realTime) {
      onStop()
    }
  })
}

// We want to keep a few chunks of audio in case the user starts speaking
// right when the recording stopped and started again
function onDataAvailable(event: any) {
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
  }, settingsStore.speechPrerecordTime)
}

// TODO: The listeners below are not removed on unmount, gotta fix that
onIPCStartSpeechTranscription(() => {
  if (!realTime && mediaRecorder) {
    console.log(`[${ getTime() }] Starting web recording`)
    mediaRecorder.start()
  }
})

onIPCStopSpeechTranscription(() => {
  if (!realTime && mediaRecorder) {
    console.log(`[${ getTime() }] Stopping web recording`)
    mediaRecorder.stop()
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
  stream?.getTracks().forEach((track) => {
    if (track.readyState === 'live') {
      track.stop()
    }
  })
  speech?.stop()
  mediaRecorder = null
  if (realTime) {
    console.log('Stopping web speech recognition...')
  } else {
    console.log('Stopping push-to-record speech recognition...')
  }
})
</script>
