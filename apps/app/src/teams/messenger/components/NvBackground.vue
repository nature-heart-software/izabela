<template>
  <Transition>
    <NvHitbox v-if="isBackgroundShown" class="absolute inset-0">
      <div
        :style="{
          opacity: settingsStore.backgroundDimOpacity / 100,
        }"
        class="w-full h-full bg-black"
      ></div>
    </NvHitbox>
  </Transition>
</template>
<script lang="ts" setup>
import NvHitbox from '@/modules/vue-hitboxes/NvHitbox.vue'
import { computed } from 'vue'
import { useMessengerWindowStore } from '@/teams/messenger/store'
import { useSettingsStore } from '@/features/settings/store'

const settingsStore = useSettingsStore()
const messengerWindowStore = useMessengerWindowStore()
const isBackgroundShown = computed(() => messengerWindowStore.isInputFocused)
</script>
