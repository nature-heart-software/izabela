<template>
  <template v-if="settingsStore.$isReady">
    <div
      :style="{
        opacity: settingsStore.backgroundDimOpacity / 100,
        zIndex: -1,
      }"
      class="fixed w-full h-full bg-black"
    ></div>
    <NvOverlayInput class="w-[720px] fixed bottom-[60px] left-1/2 transform -translate-x-1/2" />
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
import { useSettingsStore } from '@/features/settings/store'
import NvOverlayInput from '@/teams/overlay/components/NvOverlayInput.vue'

const settingsStore = useSettingsStore()
</script>
