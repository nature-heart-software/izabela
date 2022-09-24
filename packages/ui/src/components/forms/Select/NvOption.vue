<template>
  <StSelectV2Option v-bind="props">
    <slot />
  </StSelectV2Option>
</template>
<script lang="ts" setup>
import { defineProps } from 'vue'
import { StSelectV2Option } from './select.styled'
import { props as propsDefinition } from './select.shared'

const props = defineProps(propsDefinition)
</script>
