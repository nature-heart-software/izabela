<template>
  <NvButton
    ref="target"
    :class="isListeningToKeys ? css({ pointerEvents: 'none' }) : undefined"
    :title="
      isListeningToKeys ? 'Press Esc to cancel. Hold to remove' : undefined
    "
    v-bind="$attrs"
    @click="isListeningToKeys = true"
    >{{ isListeningToKeys ? 'Listening...' : readableKeybinding }}
  </NvButton>
</template>
<script lang="ts" setup>
import { css } from '@/styled-system/css'
import { NvButton } from '@packages/ui'
import {
  computed,
  onBeforeUnmount,
  PropType,
  Ref,
  ref,
  shallowRef,
  watch,
} from 'vue'
import { useEventListener, onClickOutside } from '@vueuse/core'
import { Key } from '@/types/keybinds'

const props = defineProps({
  multiple: {
    type: Boolean,
    default: false,
  },
  modelValue: {
    type: Array as PropType<Key[]>,
    default: () => [],
  },
})
const emit = defineEmits(['update:modelValue'])
const isListeningToKeys = ref(false)
const listenedKeys = ref<Record<KeyboardEvent['code'], KeyboardEvent>>({})
const cancelled = ref(false)
const keyAliases: Record<KeyboardEvent['code'], string> = {
  AltRight: 'AltGr',
  ShiftRight: 'ShiftRight',
  ControlRight: 'ControlRight',
  Space: 'Space',
  ArrowUp: 'Up',
  ArrowDown: 'Down',
  ArrowLeft: 'Left',
  ArrowRight: 'Right',
}
const rawCodeAliases: Record<KeyboardEvent['code'], number> = {
  ShiftLeft: 160,
  ShiftRight: 161,
  ControlLeft: 162,
  ControlRight: 163,
  AltLeft: 164,
  AltRight: 165,
}
const escTimeout = shallowRef<ReturnType<typeof setTimeout> | null>(null)

const target = ref(null)

onClickOutside(target, () => {
  if (isListeningToKeys.value) {
    cancelled.value = true
    isListeningToKeys.value = false
  }
})

useEventListener(
  document,
  'keydown',
  (e) => {
    if (isListeningToKeys.value) {
      e.preventDefault()
      e.stopPropagation()
      // Enter activates the button on keydown, before its keyup arrives.
      // Ignore repeats from that activation until the user releases the key.
      if (e.repeat && !listenedKeys.value[e.code]) return
      if (e.code === 'Escape' && !escTimeout.value) {
        escTimeout.value = setTimeout(() => {
          listenedKeys.value = {}
          if (escTimeout.value) clearTimeout(escTimeout.value)
          escTimeout.value = null
          isListeningToKeys.value = false
        }, 500)
      }
      if (e.code === 'AltRight' && listenedKeys.value.ControlLeft) {
        delete listenedKeys.value.ControlLeft
      }
      listenedKeys.value[e.code] = e
      if (Object.keys(listenedKeys.value).length === 3) {
        isListeningToKeys.value = false
      }
    }
  },
  { capture: true },
)

useEventListener(
  document,
  'keyup',
  (e) => {
    if (isListeningToKeys.value && listenedKeys.value[e.code]) {
      e.preventDefault()
      e.stopPropagation()
      if (e.code === 'Escape' && escTimeout.value) {
        cancelled.value = true
      }
      isListeningToKeys.value = false
    }
    if (escTimeout.value) {
      clearTimeout(escTimeout.value)
      escTimeout.value = null
    }
  },
  { capture: true },
)

onBeforeUnmount(() => {
  if (escTimeout.value) clearTimeout(escTimeout.value)
})

const keybinding: Ref<Key[]> = computed(() =>
  Object.values(listenedKeys.value).map(
    ({
      code,
      keyCode,
      which,
      key,
      shiftKey,
      altKey,
      ctrlKey,
      metaKey,
      charCode,
    }) => ({
      key: keyAliases[code] || key,
      code,
      keyCode,
      rawCode: rawCodeAliases[code] || keyCode,
      charCode,
      which,
      shiftKey,
      altKey,
      ctrlKey,
      metaKey,
    }),
  ),
)

const readableKeybinding = computed(
  () => props.modelValue.map(({ key }) => key).join(' + ') || 'None',
)

watch(isListeningToKeys, (value) => {
  if (!value) {
    if (!cancelled.value) emit('update:modelValue', keybinding.value)
    listenedKeys.value = {}
    cancelled.value = false
  }
})
</script>
