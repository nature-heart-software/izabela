<template>
  <template v-if="settingsStore.$isReady">
    <Transition>
      <NvSpeechRecordingLogo v-if="speechRecognitionStore.recording"/>
    </Transition>
    <NvSpeechSynthesizer/>
    <NvSpeechListener :key="speechListenerKey"/>
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
import NvSpeechListener from '@/teams/speech-worker/components/NvSpeechListener.vue'
import NvSpeechSynthesizer from '@/teams/speech-worker/components/NvSpeechSynthesizer.vue'
import { useSettingsStore } from '@/features/settings/store'
import { computed } from 'vue'
import hash from 'object-hash'
import NvSpeechRecordingLogo from '@/teams/speech-worker/components/NvSpeechRecordingLogo.vue'
import { useSpeechRecognitionStore } from '@/features/speech/store'

const speechRecognitionStore = useSpeechRecognitionStore()
const settingsStore = useSettingsStore()
const speechListenerKey = computed(() =>
  hash([
    settingsStore.audioInput,
    settingsStore.audioInputSensibility,
    settingsStore.speechDetectionPolling,
    settingsStore.enableSTTTS,
    settingsStore.speechRecognitionStrategy,
    settingsStore.speechInputLanguage,
    settingsStore.soxDevice,
  ]),
)
</script>
