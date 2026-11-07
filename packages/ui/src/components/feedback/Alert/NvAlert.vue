<template>
  <StAlert v-bind="props">
    <NvText>
      <slot />
    </NvText>
  </StAlert>
</template>
<script lang="ts" setup>
import NvText from '@/components/typography/Text/NvText.vue'
import { StAlert } from './alert.panda'
import { props as propsDefinition } from './alert.shared'

const props = defineProps(propsDefinition)
</script>
