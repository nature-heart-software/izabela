<template>
  <StButton :squared="squared || isVNodeEmpty($slots.default)" v-bind="$props">
    <NvText v-if="!isVNodeEmpty($slots.default)" ref="content" as="span" size="1">
      <slot />
    </NvText>
    <NvIcon v-if="iconName" :name="iconName" :size="iconSize" />
  </StButton>
</template>
<script lang="ts" setup>
import { computed, defineProps } from 'vue'
import { isVNodeEmpty } from '@/utils/vue'
import { StButton } from './button.styled'
import { props, Size } from './button.shared'
import NvText from '../Text/NvText.vue'
import NvIcon from '../Icon/NvIcon.vue'

const compopentProps = defineProps(props)
const iconSize = computed(() => {
  const sizes: { [key in Size]: string } = {
    xs: '1',
    sm: '3',
    md: '5',
    lg: '5',
  }
  return sizes[compopentProps.size]
})
</script>
