<template>
  <ThemeProvider :theme="tokens">
    <NvBackground />
    <div class="h-0">
      <div id="router-overlay"></div>
      <NvMessenger
        v-if="messengerStore.$isReady"
        :min-width="768"
        :transform="messengerStore.position.transform"
        class="w-full h-full"
      />
    </div>
    <NvDebug v-if="settingsStore.debugMode" />
  </ThemeProvider>
</template>
<style lang="scss">
body {
  width: 100vw;
  height: 100vh;
  margin: 0;
  overflow: hidden;
}

#router-overlay {
  position: relative;
  z-index: 0;
}
</style>
<script lang="ts" setup>
import { ThemeProvider } from 'vue3-styled-components'
import NvMessenger from '@/teams/messenger/components/NvMessenger.vue'
import { tokens } from '@packages/ui'
import NvBackground from '@/teams/messenger/components/NvBackground.vue'
import { useMessengerStore, useMessengerWindowStore } from '@/teams/messenger/store'
import NvDebug from '@/teams/messenger/components/NvDebug.vue'
import { useSettingsStore } from '@/features/settings/store'
import { watch } from 'vue'
import { socket } from '@/services'

const messengerStore = useMessengerStore()
const settingsStore = useSettingsStore()
const messengerWindowStore = useMessengerWindowStore()

watch(
  () => messengerWindowStore.isFocused,
  () => {
    if (messengerWindowStore.isFocused) {
      socket.emit('window:focus')
    } else {
      socket.emit('window:blur')
    }
  },
)
</script>
