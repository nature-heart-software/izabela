<template>
  <st-center :as="as" v-bind="$props">
    <slot />
  </st-center>
</template>
<script lang="ts">
import { defineComponent } from 'vue'
import { StCenter } from './center.styled'
import { props } from './center.shared'

export default defineComponent({
  name: 'nv-center',
  components: {
    StCenter,
  },
  props,
})
</script>
