<template>
  <StCard v-bind="props">
    <slot />
  </StCard>
</template>
<script lang="ts" setup>
import { StCard } from './card.panda'
import { props as propsDefinition } from './card.shared'

const props = defineProps(propsDefinition)
</script>
