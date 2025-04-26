<template></template>
<script lang="ts" setup>
import { computed, onBeforeUnmount, watchEffect } from 'vue'
import { getSoxMediaDeviceByIndex } from '@/utils/media-devices'
import { useSettingsStore } from '@/features/settings/store'
import hark from 'hark'
import { useSpeechRecognitionStore } from '@/features/speech/store'
import { computedAsync } from '@vueuse/core'

const settingsStore = useSettingsStore()
const speechRecognitionStore = useSpeechRecognitionStore()
const mediaDevice = await getSoxMediaDeviceByIndex(settingsStore.soxDevice)
const realTime = computed(
  () => settingsStore.speechRecognitionStrategy === 'continuous',
)

const stream = computedAsync(async () => {
  if (!settingsStore.enableSTTTS) return null
  return await navigator.mediaDevices.getUserMedia({
    audio: {
      deviceId: mediaDevice?.deviceId,
      sampleRate: 48000,
      sampleSize: 16,
      channelCount: 1,
    },
    video: false,
  })
}, null)

const speech = computed<any>((oldValue) => {
  console.log('creating speech instance', {
    threshold: settingsStore.audioInputSensibility,
    interval: settingsStore.speechDetectionPolling,
  })
  oldValue?.stop()
  if (realTime.value) {
    return hark(stream.value, {
      threshold: settingsStore.audioInputSensibility,
      interval: settingsStore.speechDetectionPolling,
    })
  }
  return null
})

watchEffect((onCleanup) => {
  console.log('adding speech instance listeners')
  speech.value?.on('speaking', onSpeechStarted)
  speech.value?.on('stopped_speaking', onSpeechStop)
  onCleanup(() => {
    console.log('removing speech instance listeners')
    speech.value?.off('speaking', onSpeechStarted)
    speech.value?.off('stopped_speaking', onSpeechStop)
  })
})

function onSpeechStarted() {
  console.log('Started speaking')
  speechRecognitionStore.$patch({
    recording: true,
  })
}

function onSpeechStop() {
  console.log('Stopped speaking')
  speechRecognitionStore.$patch({
    recording: false,
  })
}

watchEffect(() => {
  if (settingsStore.enableSTTTS) {
    if (realTime.value) {
      console.log('Starting web speech recognition...')
    } else {
      console.log('Starting push-to-record speech recognition...')
    }
  }
})

onBeforeUnmount(() => {
  stream.value?.getTracks().forEach((track) => {
    if (track.readyState === 'live') {
      track.stop()
    }
  })

  speech.value?.stop()
  speech.value?.off('speaking', onSpeechStarted)
  speech.value?.off('stopped_speaking', onSpeechStop)

  if (realTime.value) {
    console.log('Stopping web speech recognition...')
  } else {
    console.log('Stopping push-to-record speech recognition...')
  }
})
</script>
