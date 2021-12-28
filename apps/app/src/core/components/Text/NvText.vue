<template>
  <st-text :as="as" :size="size"><slot/></st-text>
</template>
<script lang="ts">
import { defineComponent } from 'vue'
import { StText } from './text.styled'
import { textProps } from './consts'

export default defineComponent({
  components: {
    StText,
  },
  props: textProps,
})
</script>
<style lang="scss">
body {
  @apply font-sans text-black text-2
}
</style>
