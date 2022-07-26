<template>
  <template v-if="listeningToKeys">
    <NvButton class="pointer-events-none">Listening - press Esc to cancel</NvButton>
  </template>
  <template v-else>
    <NvButton @click.prevent="getKeybinding">{{readableKeybinding}}</NvButton>
  </template>
</template>
<script lang="ts" setup>
import { NvButton } from '@/core/components'
import { computed, ref, defineProps, defineEmits, PropType } from 'vue'
import { KeybindingResult } from '@/types/keybinds'

const props = defineProps({
  multiple: {
    type: Boolean,
    default: false,
  },
  modelValue: {
    type: Object as PropType<KeybindingResult>,
    required: true,
  },
})
const emit = defineEmits(['update:modelValue'])
const { ElectronKeybinding } = window
const listeningToKeys = ref(false)
const currentKeybinding = computed(() => props.modelValue)
const readableKeybinding = computed(() => [...currentKeybinding.value.modifiers, ...currentKeybinding.value.keys].join('+'))
const getKeybinding = () => {
  listeningToKeys.value = true
  ElectronKeybinding[props.multiple ? 'getKeys' : 'getKey']().then((keybinding) => {
    listeningToKeys.value = false
    emit('update:modelValue', keybinding)
  })
}
</script>
