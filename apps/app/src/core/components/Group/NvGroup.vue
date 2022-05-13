<template>
  <StGroup :as="as" v-bind="$props">
    <slot />
  </StGroup>
</template>
<script lang="ts" setup>
import { defineProps } from 'vue'
import { StGroup } from './group.styled'
import { props } from './group.shared'

defineProps(props)
</script>
