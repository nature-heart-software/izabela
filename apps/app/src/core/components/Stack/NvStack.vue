<template>
  <StStack :as="as" v-bind="$props">
    <slot />
  </StStack>
</template>
<script lang="ts" setup>
import { defineProps } from 'vue'
import { StStack } from './stack.styled'
import { props } from './stack.shared'

defineProps(props)
</script>
