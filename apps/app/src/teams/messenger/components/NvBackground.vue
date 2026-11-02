<template>
  <div
    ref="background"
    :style="{
      willChange: 'opacity',
    }"
    :class="
      css({
        position: 'absolute',
        inset: '0',
        opacity: 0,
        pointerEvents: 'none',
      })
    "
  >
    <div
      :style="{
        opacity: settingsStore.backgroundDimOpacity / 100,
      }"
      :class="css({ width: '100%', height: '100%', backgroundColor: 'black' })"
    >
      <NvHitbox
        v-if="isBackgroundShown"
        :class="css({ width: '100%', height: '100%', pointerEvents: 'auto' })"
        @click="onBackgroundClick"
      />
    </div>
  </div>
</template>
<script lang="ts" setup>
import { css } from '@/styled-system/css'
import NvHitbox from '@/modules/vue-hitboxes/NvHitbox.vue'
import { computed, onMounted, ref, watch } from 'vue'
import { useMessengerWindowStore } from '@/teams/messenger/store'
import { useSettingsStore } from '@/features/settings/store'
import { isGameOverlay } from '@/consts.ts'
import { emitIPCGameOverlayStopIntercept } from '@/electron/events/renderer'
import gsap from 'gsap'

const background = ref()
const settingsStore = useSettingsStore()
const messengerWindowStore = useMessengerWindowStore()
const onBackgroundClick = () => {
  if (isGameOverlay) {
    emitIPCGameOverlayStopIntercept()
  }
}

const showBackground = ref(false)

const isBackgroundShown = computed(() => isGameOverlay || showBackground.value)

// this prevents click outside to close immediately when the backdrop is still visible in some cases
watch(
  () => messengerWindowStore.isInputFocused,
  (value) => {
    if (value) {
      showBackground.value = true
    } else {
      setTimeout(() => {
        showBackground.value = false
      }, 100)
    }
  },
)

watch(isBackgroundShown, (newValue) => {
  gsap.to(background.value, {
    opacity: Number(newValue),
    duration: 0.3,
    ease: 'power3.out',
  })
})

onMounted(() => {
  window.addEventListener('blur', () => {
    gsap.set(background.value, {
      opacity: 0,
      overwrite: true,
    })
    showBackground.value = false
  })
})
</script>
