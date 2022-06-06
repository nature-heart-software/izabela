<template>
  <StButton v-bind="{ ...$props, squared: componentProps.squared || isVNodeEmpty($slots.default) }">
    <span v-if="!isVNodeEmpty($slots.default)" ref="content">
      <slot />
    </span>
    <NvIcon
      class="nv-button__icon"
      v-if="componentProps.iconName"
      :name="componentProps.iconName"
      :size="iconSize"
    />
  </StButton>
</template>
<script lang="ts" setup>
import { computed, defineProps } from 'vue'
import { isVNodeEmpty } from '@/utils/vue'
import tokens from '@/styles/tokens'
import { StButton } from './button.styled'
import { props, Size } from './button.shared'
import NvIcon from '../Icon/NvIcon.vue'

const componentProps = defineProps(props)
const iconSize = computed(() => {
  const sizes: Record<Size, keyof typeof tokens.spacing> = {
    xs: 1,
    sm: 3,
    md: 5,
    lg: 5,
  }
  return sizes[componentProps.size]
})
</script>
