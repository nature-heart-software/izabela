<template>
  <div v-if="storeReady">
    <SpeechSynthesizer />
    <SpeechListener :key="store.getters['settings/persisted'].audioInput" />
  </div>
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
import { useStoreReady } from '@/hooks'
import { useStore } from 'vuex'

const { data: storeReady } = useStoreReady()
const store = useStore()
</script>
