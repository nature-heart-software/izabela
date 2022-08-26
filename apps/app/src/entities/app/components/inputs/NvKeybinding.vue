<template>
  <template v-if="isListeningToKeys">
    <NvButton class="pointer-events-none">Listening - press Esc to cancel</NvButton>
  </template>
  <template v-else>
    <NvButton @click="isListeningToKeys = true">{{ readableKeybinding }}</NvButton>
  </template>
</template>
<script lang="ts" setup>
import { NvButton } from '@packages/ui'
import { ref, defineProps, defineEmits, computed, watch, Ref, PropType } from 'vue'
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
const listenedKeys = ref<Record<KeyboardEvent['key'], KeyboardEvent>>({})
const keyAliases: Record<KeyboardEvent['key'], string> = {
  'AltGraph': 'AltGr',
}
useEventListener(document, 'keydown', (e) => {
  console.log(e)
  if (isListeningToKeys.value) {
    console.log(e)
    listenedKeys.value[e.key] = e
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

const keybinding: Ref<Key[]> = computed(() => Object.values(listenedKeys.value).map(({code, keyCode, which, key, shiftKey, altKey, ctrlKey, metaKey, charCode}) => ({
  key: keyAliases[key] || key,
  code,
  keyCode,
  charCode,
  which,
  shiftKey,
  altKey,
  ctrlKey,
  metaKey,
})))

const readableKeybinding = computed(() => props.modelValue.map(({key}) => key).join(' + ') || 'None')

watch(isListeningToKeys, (value) => {
  if (!value) {
    emit('update:modelValue', keybinding.value)
    listenedKeys.value = {}
  }
})
</script>
