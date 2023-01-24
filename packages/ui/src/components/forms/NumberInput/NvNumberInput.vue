<template>
  <StNumberInput v-bind="props">
    <component
        :is="WrappedComponent"
        ref="elInputRef"
        :model-value="props.modelValue"
        type="number"
        v-bind="$attrs"
        @update:model-value="$emit('update:model-value', $event)"
    >
      <template v-for="(_, slot) of $slots" v-slot:[slot]="scope">
        <slot :name="slot" v-bind="scope || {}"/>
      </template>
    </component>
  </StNumberInput>
</template>
<script lang="ts" setup>
import { computed, defineProps, ref } from 'vue'
import { ElInput as WrappedComponent } from 'element-plus'
import 'element-plus/lib/components/input/style/css'
import { StNumberInput } from './number-input.styled'
import { props as propsDefinition } from './number-input.shared'

const props = defineProps(propsDefinition)
const elInputRef = ref()
const input = computed(() => elInputRef.value.$el.querySelector('input'))
defineExpose({
  input,
})
</script>
