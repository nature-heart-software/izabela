<template>
  <StGroup v-bind="props">
    <slot />
  </StGroup>
</template>
<script lang="ts" setup>
import { StGroup } from './group.styled'
import { props as propsDefinition } from './group.shared'

const props = defineProps(propsDefinition)
</script>
