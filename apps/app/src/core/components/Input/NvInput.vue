<template>
  <st-input v-bind="$props">
    <component
      v-bind:is="'wrapped-component'"
      v-bind="$attrs"
      :model-value="modelValue"
      @update:model-value="$emit('update:model-value', $event)"
    >
      <template v-for="(_, slot) of $slots" v-slot:[slot]="scope">
        <slot :name="slot" v-bind="scope || {}" />
      </template>
    </component>
  </st-input>
</template>
<script lang="ts">
import { defineComponent, ref } from 'vue'
import { ElInput as WrappedComponent } from 'element-plus'
import 'element-plus/lib/components/input/style/css'
import { StInput } from './input.styled'
import { props } from './input.shared'

export default defineComponent({
  name: 'nv-input',
  components: {
    StInput,
    WrappedComponent,
  },
  props,
  setup() {
    return {
      input: ref(''),
    }
  },
})
</script>
