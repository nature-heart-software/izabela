<template>
  <StText :as="as" v-bind="$props">
    <slot />
  </StText>
</template>
<script lang="ts" setup>
import { defineProps } from 'vue'
import { StText } from './text.styled'
import { props } from './text.shared'

defineProps(props)
</script>
<style lang="scss">
body {
  @apply font-sans text-gray-80 text-2;
}
</style>
