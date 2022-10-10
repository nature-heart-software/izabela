<template>
  <NvCard class="h-7" size="xs">
    <NvGroup :spacing="2" noWrap>
      <template v-if="settingsStore.debugMode">
        <NvButton icon-name="redo" size="sm" @click="reload" />
        <NvButton icon-name="brackets-curly" size="sm" @click="openDevTools" />
      </template>
    </NvGroup>
  </NvCard>
</template>
<script lang="ts" setup>
import { NvButton, NvCard, NvGroup } from '@packages/ui'
import { useSettingsStore } from '@/features/settings/store'

const settingsStore = useSettingsStore()
const { ElectronMessengerWindow } = window
const openDevTools = () => {
  ElectronMessengerWindow.openDevTools()
}

const reload = () => {
  window.location.reload()
}
</script>
