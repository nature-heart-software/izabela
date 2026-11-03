<template>
  <StButton
    :aria-busy="props.loading || undefined"
    :data-selected="props.selected ? '' : undefined"
    v-bind="{
      ...props,
      squared: props.squared || isVNodeEmpty($slots.default),
    }"
  >
    <span v-if="!isVNodeEmpty($slots.default)" ref="content">
      <slot />
    </span>
    <span
      v-if="props.loading"
      class="nv-button__loading"
      role="status"
      aria-label="Loading"
    >
      <svg :class="loadingSpinner()" viewBox="0 0 50 50" aria-hidden="true">
        <circle cx="25" cy="25" r="20" />
      </svg>
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
import { computed } from 'vue'
import { isVNodeEmpty } from '@/utils/vue'
import { loadingSpinner } from '@/utils/loading-spinner'
import { tokens } from '@/styles/tokens'
import { StButton } from './button.panda'
import { props as propsDefinition, Size } from './button.shared'
import NvIcon from '@/components/typography/Icon/NvIcon.vue'
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
