<template>
  <st-switch tabindex="0" :as="as" v-bind="$props" @click="toggleValue">
    <label :for="id">
      <input
        :id="id"
        type="checkbox"
        :value="modelValue"
        @change="$emit('update:modelValue', $event.target.value)"
        hidden
      />
    </label>
  </st-switch>
</template>
<script lang="ts">
import { defineComponent, ref } from 'vue'
import { v4 as uuid } from 'uuid'
import { StSwitch } from './switch.styled'
import { props } from './switch.shared'

export default defineComponent({
  name: 'nv-switch',
  components: {
    StSwitch,
  },
  props,
  setup() {
    return {
      id: ref(uuid()),
    }
  },
  methods: {
    toggleValue() {
      this.$emit('update:modelValue', !this.modelValue)
    },
  },
})
</script>
