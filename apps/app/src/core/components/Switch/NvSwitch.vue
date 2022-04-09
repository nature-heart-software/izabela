<template>
  <st-switch tabindex="0" :as="as" v-bind="$props" @click="toggleValue">
    <input
      type="checkbox"
      :value="modelValue"
      @change="$emit('update:modelValue', $event.target.value)"
      hidden
    />
  </st-switch>
</template>
<script lang="ts">
import { defineComponent } from 'vue'
import { StSwitch } from './switch.styled'
import { props } from './switch.shared'

export default defineComponent({
  name: 'nv-switch',
  components: {
    StSwitch,
  },
  props,
  methods: {
    toggleValue() {
      this.$emit('update:modelValue', !this.modelValue)
    },
  },
})
</script>
