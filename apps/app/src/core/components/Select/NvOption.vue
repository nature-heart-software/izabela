<template>
  <st-option v-bind="$props">
    <template v-for="(_, slot) of $slots" v-slot:[slot]="scope">
      <slot :name="slot" v-bind="scope || {}" />
    </template>
  </st-option>
</template>
<script lang="ts">
import { defineComponent, ref } from 'vue'
import { StOption } from './select.styled'
import { props, Size } from './select.shared'

export default defineComponent({
  name: 'nv-option',
  components: {
    StOption,
  },
  props,
})
</script>
