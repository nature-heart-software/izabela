<template>
  <template v-if="settingsStore.$isReady"></template>
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

const settingsStore = useSettingsStore()
</script>
