<template>
  <StButton v-bind="{ ...props, squared: props.squared || isVNodeEmpty($slots.default) }">
    <span v-if="!isVNodeEmpty($slots.default)" ref="content">
      <slot/>
    </span>
    <NvIcon
      v-if="props.iconName"
      :name="props.iconName"
      :size="iconSize"
      class="nv-button__icon"
    />
  </StButton>
</template>
<script lang="ts" setup>
import { computed, defineProps } from 'vue'
import { isVNodeEmpty } from '@/utils/vue'
import tokens from '@/styles/tokens'
import { StButton } from './button.styled'
import { props as propsDefinition, Size } from './button.shared'
import NvIcon from '../Icon/NvIcon.vue'

const props = defineProps(propsDefinition)
const iconSize = computed(() => {
  const sizes: Record<Size, keyof typeof tokens.spacing> = {
    xs: 1,
    sm: 3,
    md: 5,
    lg: 5,
  }
  return sizes[props.size]
})
</script>
