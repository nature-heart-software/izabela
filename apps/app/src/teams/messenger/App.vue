<template>
  <ThemeProvider :theme="tokens">
    <template v-if="isReady">
      <div class="h-0">
        <NvMessenger
          :min-width="768"
          :transform="$store.getters['messenger/persisted'].position.transform"
          class="w-full h-full"
        />
      </div>
    </template>
  </ThemeProvider>
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
import { ThemeProvider } from 'vue3-styled-components'
import NvMessenger from '@/teams/messenger/components/NvMessenger.vue'
import tokens from '@/styles/tokens'
import useStoreReady from '../../hooks/useStoreReady'

const { data: isReady } = useStoreReady()
</script>
