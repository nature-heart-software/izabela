<template>
  <st-icon v-bind="$props" :class="[`uil uil-${name}`]"></st-icon>
</template>
<script lang="ts">
import { defineComponent } from 'vue'
import { StIcon } from './icon.styled'
import { props } from './icon.shared'

export default defineComponent({
  name: 'nv-icon',
  components: {
    StIcon,
  },
  props,
})
</script>
<style lang="scss">
body {
  @apply font-sans text-gray-80 text-2;
}
</style>
