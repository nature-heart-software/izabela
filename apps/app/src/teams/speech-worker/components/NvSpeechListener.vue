<template></template>
<script lang="ts" setup>
import { watch } from 'vue'
import { getSoxMediaDeviceByIndex } from '@/utils/media-devices'
import { useSettingsStore } from '@/features/settings/store'
import hark from 'hark'
import { useSpeechRecognitionStore } from '@/features/speech/store'

const settingsStore = useSettingsStore()
const speechRecognitionStore = useSpeechRecognitionStore()

watch(
  () =>
    [
      settingsStore.enableSTTTS,
      settingsStore.speechRecognitionStrategy,
      settingsStore.soxDevice,
      settingsStore.audioInputSensibility,
      settingsStore.speechDetectionPolling,
    ] as const,
  async (
    [enabled, strategy, deviceIndex, threshold, interval],
    _,
    onCleanup,
  ) => {
    if (!enabled || strategy !== 'continuous') return

    let cancelled = false
    let stream: MediaStream | undefined
    let speech: ReturnType<typeof hark> | undefined
    const onSpeechStarted = () =>
      speechRecognitionStore.$patch({ recording: true })
    const onSpeechStopped = () =>
      speechRecognitionStore.$patch({ recording: false })
    const stopTracks = () =>
      stream?.getTracks().forEach((track) => track.stop())
    const stop = () => {
      speech?.off('speaking', onSpeechStarted)
      speech?.off('stopped_speaking', onSpeechStopped)
      speech?.stop()
      stopTracks()
      onSpeechStopped()
    }

    // Register before either await: a device change or unmount can happen while
    // device enumeration or the microphone permission request is still pending.
    onCleanup(() => {
      cancelled = true
      stop()
    })

    try {
      const device = await getSoxMediaDeviceByIndex(deviceIndex)
      if (cancelled) return
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: device ? { exact: device.deviceId } : undefined,
          sampleRate: 48000,
          sampleSize: 16,
          channelCount: 1,
        },
        video: false,
      })
      if (cancelled) {
        stopTracks()
        return
      }
      speech = hark(stream, { threshold, interval })
      speech.on('speaking', onSpeechStarted)
      speech.on('stopped_speaking', onSpeechStopped)
      await speech.resume()
    } catch (error) {
      if (!cancelled) {
        stop()
        console.error('Unable to start microphone speech detection', error)
      }
    }
  },
  { immediate: true },
)
</script>
