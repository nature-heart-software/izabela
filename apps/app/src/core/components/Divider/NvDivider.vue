<template>
  <st-divider v-bind="$props" />
</template>
<script lang="ts">
import { defineComponent } from 'vue'
import { StDivider } from './divider.styled'
import { props } from './divider.shared'

export default defineComponent({
  name: 'nv-divider',
  components: {
    StDivider,
  },
  props,
})
</script>
