<template>
  <Transition>
    <NvHitbox v-if="isBackgroundShown" class="absolute inset-0" @click="isWindowShowing = false">
      <div class="w-full h-full bg-black bg-opacity-50"></div>
    </NvHitbox>
  </Transition>
</template>
<script lang="ts" setup>
import NvHitbox from '@/modules/vue-hitboxes/NvHitbox.vue'
import { computed } from 'vue'
import { useMessengerWindowStore } from '@/teams/messenger/store'

const messengerWindowStore = useMessengerWindowStore()
const isBackgroundShown = computed(() => messengerWindowStore.isInputFocused)
</script>
