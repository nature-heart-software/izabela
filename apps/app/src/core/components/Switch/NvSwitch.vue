<template>
  <StSwitch :as="as" tabindex="0" v-bind="props" @click="toggleValue">
    <label :for="id">
      <input
        :id="id"
        :value="props.modelValue"
        hidden
        type="checkbox"
        @change="$emit('update:modelValue', $event.target.value)"
      />
    </label>
  </StSwitch>
</template>
<script lang="ts" setup>
import { defineEmits, defineProps, ref } from 'vue'
import { v4 as uuid } from 'uuid'
import { StSwitch } from './switch.styled'
import { props as propsDefinition } from './switch.shared'

const props = defineProps(propsDefinition)
const emit = defineEmits(['update:modelValue'])

const id = ref(uuid())

const toggleValue = () => {
  emit('update:modelValue', !props.modelValue)
}
</script>
