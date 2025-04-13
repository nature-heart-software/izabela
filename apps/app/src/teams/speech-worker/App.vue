<template>
  <template v-if="isReady">
    <NvSpeechRecordingLogo
      v-if="settingsStore.enableSTTTS && speechRecognitionStore.recording"
    />
    <NvSpeechSynthesizer />
    <NvSpeechListener :key="speechListenerKey" />
    <NvAudioInputUpdater />
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
import { computed, ref, watch } from 'vue'
import hash from 'object-hash'
import NvSpeechRecordingLogo from '@/teams/speech-worker/components/NvSpeechRecordingLogo.vue'
import { useSpeechRecognitionStore } from '@/features/speech/store'
import NvAudioInputUpdater from '@/teams/speech-worker/components/NvAudioInputUpdater.vue'
import { socket } from '@/services'
import { storesStates } from '@/store'

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

watch(
  () => speechRecognitionStore.recording,
  () => {
    if (speechRecognitionStore.recording) {
      socket.emit('speech:recording:start')
    } else {
      socket.emit('speech:recording:end')
    }
  },
)

const isReady = ref(false)
Promise.all(
  Object.values(storesStates).map((storeStates) => storeStates.$whenReady()),
).then(() => (isReady.value = true))
</script>
