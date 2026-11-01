<template>
  <StStack v-bind="props">
    <slot />
  </StStack>
</template>
<script lang="ts" setup>
import { StStack } from './stack.styled'
import { props as propsDefinition } from './stack.shared'

const props = defineProps(propsDefinition)
</script>
