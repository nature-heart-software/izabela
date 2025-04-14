<template>
  <template v-if="isReady">
    <div
      :style="{
        opacity: settingsStore.backgroundDimOpacity / 100,
        zIndex: -1,
      }"
      class="fixed w-full h-full bg-black"
    ></div>
    <NvOverlayInput
      class="w-[720px] fixed bottom-[60px] left-1/2 transform -translate-x-1/2"
    />
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
import { ref } from 'vue'
import { storesStates } from '@/store'

const settingsStore = useSettingsStore()

const isReady = ref(false)
Promise.all(
  Object.values(storesStates).map((storeStates) => storeStates.$whenReady()),
).then(() => (isReady.value = true))
</script>
