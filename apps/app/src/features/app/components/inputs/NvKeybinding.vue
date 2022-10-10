<template>
  <template v-if="isListeningToKeys">
    <NvButton class="pointer-events-none" title="Press Esc to cancel" v-bind="$attrs"
    >Listening...
    </NvButton
    >
  </template>
  <template v-else>
    <NvButton v-bind="$attrs" @click="isListeningToKeys = true">{{ readableKeybinding }}</NvButton>
  </template>
</template>
<script lang="ts" setup>
import { NvButton } from '@packages/ui'
import { computed, defineEmits, defineProps, PropType, Ref, ref, watch } from 'vue'
import { useEventListener } from '@vueuse/core'
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
useEventListener(document, 'keydown', (e) => {
  if (isListeningToKeys.value) {
    if (e.code === 'AltRight' && listenedKeys.value.ControlLeft) {
      delete listenedKeys.value.ControlLeft
    }
    listenedKeys.value[e.code] = e
    if (Object.keys(listenedKeys.value).length === 3) {
      isListeningToKeys.value = false
    }
  }
})

useEventListener(document, 'keyup', () => {
  if (isListeningToKeys.value) {
    isListeningToKeys.value = false
  }
})

const keybinding: Ref<Key[]> = computed(() =>
  Object.values(listenedKeys.value).map(
    ({ code, keyCode, which, key, shiftKey, altKey, ctrlKey, metaKey, charCode }) => ({
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
    emit('update:modelValue', keybinding.value)
    listenedKeys.value = {}
  }
})
</script>
