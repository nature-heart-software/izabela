<template>
  <template v-if="settingsStore.$isReady">
    <NvOverlayInput class="w-[720px] fixed bottom-[60px] left-1/2 transform -translate-x-1/2" />
  </template>
</template>
<style lang="scss">
body {
  width: 100vw;
  height: 100vh;
  margin: 0;
  overflow: hidden;
  background-color: rgba(0, 0, 0, 0.5);
}
</style>
<script lang="ts" setup>
import { useSettingsStore } from '@/features/settings/store'
import { onIPCOverlayInput } from '@/electron/events/renderer'
import NvOverlayInput from '@/teams/overlay/components/NvOverlayInput.vue'

const settingsStore = useSettingsStore()
onIPCOverlayInput((event) => {
  console.log(event)
})
</script>
