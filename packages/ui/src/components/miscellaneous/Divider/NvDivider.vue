<template>
  <StDivider v-bind="props" />
</template>
<script lang="ts" setup>
import { defineProps } from 'vue'
import { StDivider } from './divider.styled'
import { props as propsDefinition } from './divider.shared'

const props = defineProps(propsDefinition)
</script>
