<template>
  <StCard v-bind="props">
    <slot />
  </StCard>
</template>
<script lang="ts" setup>
import { StCard } from './card.styled'
import { props as propsDefinition } from './card.shared'

const props = defineProps(propsDefinition)
</script>
