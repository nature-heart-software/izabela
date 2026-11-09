<template>
  <StTextarea ref="elInputRef" v-bind="props" v-model="model" />
</template>
<script lang="ts" setup>
import { computed, ref } from 'vue'
import { props as propsDefinition } from './textarea.shared'
import { StTextarea } from './textarea.panda'

const model = defineModel()
const props = defineProps(propsDefinition)
const elInputRef = ref()
const input = computed(() => elInputRef.value.$el)
defineExpose({
  input,
})
</script>
