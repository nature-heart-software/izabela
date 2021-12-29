<template>
  <st-button v-bind="$props">
    <nv-text as="span">
      <slot/>
    </nv-text>
  </st-button>
</template>
<script lang="ts">
import { defineComponent } from 'vue'
import { StButton } from './button.styled'
import { buttonProps } from './button.shared'
import { NvText } from '../'

export default defineComponent({
  components: {
    StButton,
    NvText,
  },
  props: buttonProps,
  mounted() {
    console.log(this.$props)
  }
})
</script>
