<template>
  <Transition>
    <NvHitbox v-if="isBackgroundShown" class="absolute inset-0">
      <div
        :style="{
          opacity: settingsStore.backgroundDimOpacity / 100,
        }"
        class="w-full h-full bg-black relative z-0"
        @click="onBackgroundClick"
      ></div>
    </NvHitbox>
  </Transition>
</template>
<script lang="ts" setup>
import NvHitbox from '@/modules/vue-hitboxes/NvHitbox.vue'
import { computed } from 'vue'
import { useMessengerWindowStore } from '@/teams/messenger/store'
import { useSettingsStore } from '@/features/settings/store'
import { isGameOverlay } from '@/consts.ts'
import { emitIPCGameOverlayStopIntercept } from '@/electron/events/renderer'

const settingsStore = useSettingsStore()
const messengerWindowStore = useMessengerWindowStore()
const onBackgroundClick = () => {
  if (isGameOverlay) {
    emitIPCGameOverlayStopIntercept()
  }
}
const isBackgroundShown = computed(() => isGameOverlay || messengerWindowStore.isInputFocused)
</script>
