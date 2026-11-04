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
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
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
let hideTimeout: ReturnType<typeof setTimeout> | undefined
let nativeWindowFocused = false
let preparingToHide = false

function cancelPendingHide() {
  if (hideTimeout !== undefined) {
    clearTimeout(hideTimeout)
    hideTimeout = undefined
  }
}

function resetBackground() {
  cancelPendingHide()
  showBackground.value = false
  if (background.value) {
    gsap.set(background.value, { opacity: 0, overwrite: true })
  }
}

const isBackgroundShown = computed(() => isGameOverlay || showBackground.value)

// this prevents click outside to close immediately when the backdrop is still visible in some cases
watch(
  () => messengerWindowStore.isInputFocused,
  (value) => {
    cancelPendingHide()
    if (preparingToHide || document.visibilityState === 'hidden') {
      resetBackground()
      return
    }
    if (value) {
      showBackground.value = true
    } else {
      hideTimeout = setTimeout(() => {
        hideTimeout = undefined
        showBackground.value = false
      }, 100)
    }
  },
)

watch(isBackgroundShown, (newValue) => {
  if (preparingToHide || document.visibilityState === 'hidden') {
    gsap.set(background.value, { opacity: 0, overwrite: true })
    return
  }
  gsap.to(background.value, {
    opacity: Number(newValue),
    duration: 0.3,
    ease: 'power3.out',
    overwrite: true,
  })
})

watch(
  () => [messengerWindowStore.focusContext, messengerWindowStore.isFocused],
  ([context, focused]) => {
    if (
      context !== 'mouse' ||
      (!focused && !nativeWindowFocused) ||
      messengerWindowStore.isInputFocused
    )
      return
    // A mouse activation must not briefly reveal the previous keyboard fade.
    resetBackground()
  },
)

function onWindowBlur() {
  nativeWindowFocused = false
  cancelPendingHide()
  showBackground.value = false
}

function onWindowFocus() {
  preparingToHide = false
  nativeWindowFocused = true
  showForActivation()
}

function showForActivation() {
  cancelPendingHide()
  if (
    !preparingToHide &&
    document.visibilityState !== 'hidden' &&
    messengerWindowStore.focusContext === 'keyboard'
  ) {
    showBackground.value = true
  } else {
    resetBackground()
  }
}

function onVisibilityChange() {
  if (document.visibilityState === 'hidden') {
    // Hidden Electron windows suspend animation frames. Do not leave an opaque
    // frame or unfinished fade to be replayed when the native window reappears.
    nativeWindowFocused = false
    resetBackground()
  } else {
    // Native visibility precedes the IPC-shared focus state by a frame or more.
    showForActivation()
  }
}

function onPrepareHide() {
  preparingToHide = true
  resetBackground()
}

onMounted(() => {
  nativeWindowFocused = document.hasFocus()
  window.addEventListener('blur', onWindowBlur)
  window.addEventListener('focus', onWindowFocus)
  window.addEventListener('nv-messenger-prepare-hide', onPrepareHide)
  document.addEventListener('visibilitychange', onVisibilityChange)
  if (document.visibilityState === 'hidden') resetBackground()
})

onBeforeUnmount(() => {
  cancelPendingHide()
  window.removeEventListener('blur', onWindowBlur)
  window.removeEventListener('focus', onWindowFocus)
  window.removeEventListener('nv-messenger-prepare-hide', onPrepareHide)
  document.removeEventListener('visibilitychange', onVisibilityChange)
  gsap.killTweensOf(background.value)
})
</script>
