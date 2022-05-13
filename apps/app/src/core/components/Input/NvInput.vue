<template>
  <StInput v-bind="$props">
    <component
      :is="WrappedComponent"
      :model-value="$props.modelValue"
      v-bind="$attrs"
      @update:model-value="$emit('update:model-value', $event)"
    >
      <template v-for="(_, slot) of $slots" v-slot:[slot]="scope">
        <slot :name="slot" v-bind="scope || {}" />
      </template>
    </component>
  </StInput>
</template>
<script lang="ts" setup>
import { defineProps } from 'vue'
import { ElInput as WrappedComponent } from 'element-plus'
import 'element-plus/lib/components/input/style/css'
import { StInput } from './input.styled'
import { props } from './input.shared'

defineProps(props)
</script>
