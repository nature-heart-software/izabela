<template>
  <StCenter v-bind="props">
    <slot />
  </StCenter>
</template>
<script lang="ts" setup>
import { defineProps } from 'vue'
import { StCenter } from './center.styled'
import { props as propsDefinition } from './center.shared'

const props = defineProps(propsDefinition)
</script>
