<template>
  <template v-if="settingsStore.$isReady">
    <SpeechSynthesizer/>
    <SpeechListener :key="speechListenerKey"/>
  </template>
</template>
<style lang="scss">
body {
  width: 100vw;
  height: 100vh;
  margin: 0;
  overflow: hidden;
}
</style>
<script lang="ts" setup>
import SpeechListener from '@/teams/speech-worker/components/NvSpeechListener.vue'
import SpeechSynthesizer from '@/teams/speech-worker/components/NvSpeechSynthesizer.vue'
import { useSettingsStore } from '@/features/settings/store'
import { computed } from 'vue'
import hash from 'object-hash'

const settingsStore = useSettingsStore()
const speechListenerKey = computed(() =>
  hash([
    settingsStore.audioInput,
    settingsStore.audioInputSensibility,
    settingsStore.speechPrerecordTime,
    settingsStore.speechPostrecordTime,
    settingsStore.automaticSpeechDetection,
    settingsStore.enableSTTTS,
    settingsStore.speechRecordingStrategy,
  ]),
)
</script>
