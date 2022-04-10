<template>
  <st-stack :as="as" v-bind="$props">
    <slot />
  </st-stack>
</template>
<script lang="ts">
import { defineComponent } from 'vue'
import { StStack } from './stack.styled'
import { props } from './stack.shared'

export default defineComponent({
  name: 'nv-stack',
  components: {
    StStack,
  },
  props,
})
</script>
