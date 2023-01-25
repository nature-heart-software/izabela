<template>
  <StRangeInput :value="props.modelValue" tabindex="0" type="range" v-bind="props"
                @input="$emit('update:modelValue', Number($event.target.value))"/>
</template>
<script lang="ts" setup>
import { defineEmits, defineProps } from 'vue'
import { StRangeInput } from './range-input.styled'
import { props as propsDefinition } from './range-input.shared'

const props = defineProps(propsDefinition)
const emit = defineEmits(['update:modelValue'])
</script>
