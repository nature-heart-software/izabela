<template>
  <StIcon :class="[`uil uil-${name}`]" v-bind="$props" />
</template>
<script lang="ts" setup>
import { defineProps } from 'vue'
import { StIcon } from './icon.styled'
import { props } from './icon.shared'

defineProps(props)
</script>
<style lang="scss">
body {
  @apply font-sans text-gray-80 text-2;
}
</style>
