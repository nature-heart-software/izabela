<template>
  <st-group :as="as" v-bind="$props">
    <slot />
  </st-group>
</template>
<script lang="ts">
import { defineComponent } from 'vue'
import { StGroup } from './group.styled'
import { props } from './group.shared'

export default defineComponent({
  name: 'nv-group',
  components: {
    StGroup,
  },
  props,
})
</script>
