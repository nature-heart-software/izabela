<template>
  <StText v-bind="props">
    <slot />
  </StText>
</template>
<script lang="ts" setup>
import { defineProps } from 'vue'
import { StText } from './text.styled'
import { props as propsDefinition } from './text.shared'

const props = defineProps(propsDefinition)
</script>
