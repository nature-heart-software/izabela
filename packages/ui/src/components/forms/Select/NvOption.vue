<template>
  <StSelectOption v-bind="props">
    <slot />
  </StSelectOption>
</template>
<script lang="ts" setup>
import { defineProps } from 'vue'
import { StSelectOption } from './select.styled'
import { props as propsDefinition } from './select.shared'

const props = defineProps(propsDefinition)
</script>
