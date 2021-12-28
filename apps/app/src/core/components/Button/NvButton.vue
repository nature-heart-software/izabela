<template>
  <st-button :size="size">
    <nv-text as="span">
      <slot/>
    </nv-text>
  </st-button>
</template>
<script lang="ts">
import { defineComponent } from 'vue'
import { StButton } from './button.styled'
import { buttonProps } from './consts'
import { NvText } from '../'

export default defineComponent({
  components: {
    StButton,
    NvText,
  },
  props: buttonProps,
})
</script>
