<template>
  <StButton v-bind="{ ...$props, squared: componentProps.squared || isVNodeEmpty($slots.default) }">
    <NvText v-if="!isVNodeEmpty($slots.default)" ref="content" as="span" size="1">
      <slot />
    </NvText>
    <NvIcon v-if="componentProps.iconName" :name="componentProps.iconName" :size="iconSize" />
  </StButton>
</template>
<script lang="ts" setup>
import { computed, defineProps } from 'vue'
import { isVNodeEmpty } from '@/utils/vue'
import { StButton } from './button.styled'
import { props, Size } from './button.shared'
import NvText from '../Text/NvText.vue'
import NvIcon from '../Icon/NvIcon.vue'

const componentProps = defineProps(props)
const iconSize = computed(() => {
  const sizes: { [key in Size]: string } = {
    xs: '1',
    sm: '3',
    md: '5',
    lg: '5',
  }
  return sizes[componentProps.size]
})
</script>
