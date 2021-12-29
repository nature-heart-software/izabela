<template>
  <st-text :as="as" v-bind="$props"><slot/></st-text>
</template>
<script lang="ts">
import { defineComponent } from 'vue'
import { StText } from './text.styled'
import { textProps } from './text.shared'

export default defineComponent({
  components: {
    StText,
  },
  props: textProps,
})
</script>
<style lang="scss">
body {
  @apply font-sans text-gray-80 text-2
}
</style>
