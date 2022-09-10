<template>
  <ThemeProvider :theme="tokens">
    <NvBackground />
    <div class="h-0">
      <NvMessenger
        v-if="messengerStore.$isReady"
        :min-width="768"
        :transform="messengerStore.position.transform"
        class="w-full h-full"
      />
    </div>
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
import { tokens } from '@packages/ui'
import NvBackground from '@/teams/messenger/components/NvBackground.vue'
import { useMessengerStore } from '@/teams/messenger/store'

const messengerStore = useMessengerStore()
</script>
