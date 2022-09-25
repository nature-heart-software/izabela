<template>
  <Transition>
    <DomBoundary v-if="isBackgroundShown" class="absolute inset-0" @click="isWindowShowing = false">
      <div class="w-full h-full bg-black bg-opacity-50"></div>
    </DomBoundary>
  </Transition>
</template>
<script lang="ts" setup>
import DomBoundary from '@/modules/vue-dom-boundaries/DomBoundary.vue'
import { computed } from 'vue'
import { useMessengerWindowStore } from '@/teams/messenger/store'

const messengerWindowStore = useMessengerWindowStore()
const isBackgroundShown = computed(() => messengerWindowStore.isInputFocused)
</script>
