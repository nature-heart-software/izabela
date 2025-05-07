<template>
  <button
    v-show="displayOffscreenFocusFix"
    id="offscreen-focus-fix"
    :style="{
      zIndex: 999999999,
    }"
    class="fixed inset-0 pointer-events-auto cursor-none"
    @click="displayOffscreenFocusFix = false"
  />
  <ThemeProvider :theme="tokens">
    <NvBackground />
    <div class="h-0">
      <div id="router-overlay" ref="routerOverlay"></div>
      <NvMessenger
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
import { ref, watch, provide } from 'vue'
import { socket } from '@/services'
import { isGameOverlay } from '@/consts.ts'
import { useDatabasesStore } from '@/features/databases/store'
import takeRight from 'lodash/takeRight'
import pkg from '@root/package.json'
import { useGameOverlayStore } from '@/features/game-overlay/store'
import { onIPCApplyProfile } from '@/electron/events/renderer.ts'
import { useProfilesStore } from '@/features/profiles/store.ts'

const { ElectronMessengerWindow } = window
const messengerStore = useMessengerStore()
const settingsStore = useSettingsStore()
const gameOverlayStore = useGameOverlayStore()
const messengerWindowStore = useMessengerWindowStore()
const displayOffscreenFocusFix = ref(isGameOverlay)

const routerOverlay = ref()
provide('router-overlay', routerOverlay)
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

const databasesStore = useDatabasesStore()

if (!isGameOverlay) {
  databasesStore.$whenReady().then(() => {
    const repository = takeRight(pkg.repository.split('/'), 2).join('/')
    databasesStore.databases.forEach((database) => {
      fetch(
        `https://raw.githubusercontent.com/${repository}/refs/heads/dev/databases/${database}.json`,
      )
        .then((res) => {
          return res.json()
        })
        .then((data) => {
          databasesStore.setDatabaseData(database, data)
        })
    })
  })
}

/* Need to wait for the stores to be ready before resetting states
 **/
watch(
  () => settingsStore.runAsAdmin,
  (value) => {
      if (!value) {
        settingsStore.$patch({
          enableOverlayWindow: false,
        })
        gameOverlayStore.$patch({
          enableGameOverlay: false,
        })
      }
  },
)

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

const profilesStore = useProfilesStore()
onIPCApplyProfile((id) => {
  if (!isGameOverlay) {
    profilesStore.apply(id)
    const profile = profilesStore.profiles.find((p) => p.id === id)
    if (profile) {
      const { ElectronDialog } = window
      ElectronDialog.showNotification({
        title: 'Applied profile',
        body: profile.name,
        silent: true,
      })
    }
  }
})
</script>
