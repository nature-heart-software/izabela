<template>
  <st-button v-bind="$props" :squared="squared || isVNodeEmpty($slots.default)">
    <nv-text as="span" ref="content" v-if="!isVNodeEmpty($slots.default)">
      <slot />
    </nv-text>
    <nv-icon v-if="iconName" :name="iconName" :size="iconSize" />
  </st-button>
</template>
<script lang="ts">
import { defineComponent } from 'vue'
import { StButton } from './button.styled'
import { props, Size } from './button.shared'
import NvText from '../Text/NvText.vue'
import NvIcon from '../Icon/NvIcon.vue'
import { isVNodeEmpty } from '@/utils/vue'

export default defineComponent({
  name: 'nv-button',
  components: {
    StButton,
    NvText,
    NvIcon,
  },
  props,
  setup() {
    return {
      isVNodeEmpty,
    }
  },
  computed: {
    iconSize() {
      const sizes: { [key in Size]: string } = {
        xs: '1',
        sm: '3',
        md: '5',
        lg: '5',
      }
      return sizes[this.size]
    },
  },
})
</script>
