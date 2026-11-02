<template>
  <StRangeInput
    :value="props.modelValue"
    type="range"
    v-bind="props"
    @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
  />
</template>
<script lang="ts" setup>
import { StRangeInput } from './range-input.panda'
import { props as propsDefinition } from './range-input.shared'

const props = defineProps(propsDefinition)
const emit = defineEmits(['update:modelValue'])
</script>
