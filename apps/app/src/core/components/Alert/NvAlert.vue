<template>
  <StAlert v-bind="props">
    <NvText>
      <slot/>
    </NvText>
  </StAlert>
</template>
<script lang="ts" setup>
import { defineProps } from 'vue'
import NvText from '@/core/components/Text/NvText.vue'
import { StAlert } from './alert.styled'
import { props as propsDefinition } from './alert.shared'

const props = defineProps(propsDefinition)
</script>
