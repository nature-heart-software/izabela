<template>
  <Transition class="transition">
    <DomBoundary v-if="isBackgroundShown"
                 class="absolute inset-0" @click="isWindowShowing = false">
      <div class="w-full h-full bg-black bg-opacity-20"></div>
    </DomBoundary>
  </Transition>
</template>
<script lang="ts" setup>
import DomBoundary from '@/modules/vue-dom-boundaries/DomBoundary.vue'
import { useStore } from 'vuex'
import { computed, ref, watch } from 'vue'

const store = useStore()
const isWindowShowing = ref(false)
const isBackgroundShown = computed(() => (isWindowShowing.value) || store.state.messenger.isInputFocused)

watch(store.state.messenger.isShown, () => {
  if (store.state.messenger.isShown) {
    isWindowShowing.value = true
  }
})
</script>
