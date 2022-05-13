<template>
  <StCard v-bind="$props">
    <slot />
  </StCard>
</template>
<script lang="ts" setup>
import { defineProps } from 'vue'
import { StCard } from './card.styled'
import { props } from './card.shared'

defineProps(props)
</script>
