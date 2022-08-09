<template>
  <StCard v-bind="props">
    <slot />
  </StCard>
</template>
<script lang="ts" setup>
import { defineProps } from 'vue'
import { StCard } from './card.styled'
import { props as propsDefinition } from './card.shared'

const props = defineProps(propsDefinition)
</script>
