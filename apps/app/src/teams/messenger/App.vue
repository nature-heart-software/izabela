<template>
  <button
    v-show="displayOffscreenFocusFix"
    id="offscreen-focus-fix"
    :style="{
      zIndex: 999999999,
    }"
    class="fixed inset-0 pointer-events-auto"
    @click="displayOffscreenFocusFix = false"
  />
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
    <NvDebug v-if="!isGameOverlay && settingsStore.debugMode" />
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
import {
  useMessengerStore,
  useMessengerWindowStore,
} from '@/teams/messenger/store'
import NvDebug from '@/teams/messenger/components/NvDebug.vue'
import { useSettingsStore } from '@/features/settings/store'
import { ref, watch } from 'vue'
import { socket } from '@/services'
import { isGameOverlay } from '@/consts.ts'

const { ElectronMessengerWindow } = window
const messengerStore = useMessengerStore()
const settingsStore = useSettingsStore()
const messengerWindowStore = useMessengerWindowStore()
const displayOffscreenFocusFix = ref(isGameOverlay)

window.addEventListener('keydown', (event) => {
  const isCtrlOrCmdKey = event.ctrlKey || event.metaKey

  if (isCtrlOrCmdKey && (event.key === '+' || event.key === '=')) {
    ElectronMessengerWindow.zoomIn()
  }

  if (isCtrlOrCmdKey && (event.key === '-' || event.key === '_')) {
    ElectronMessengerWindow.zoomOut()
  }

  if (isCtrlOrCmdKey && event.key === '0') {
    ElectronMessengerWindow.resetZoom()
  }
})

if (isGameOverlay) {
  window.addEventListener('blur', () => {
    displayOffscreenFocusFix.value = true
  })
}

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
