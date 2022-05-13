<template>
  <StCenter :as="as" v-bind="$props">
    <slot />
  </StCenter>
</template>
<script lang="ts" setup>
import { defineProps } from 'vue'
import { StCenter } from './center.styled'
import { props } from './center.shared'

defineProps(props)
</script>
