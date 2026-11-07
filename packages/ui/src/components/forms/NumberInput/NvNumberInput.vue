<template>
  <StNumberInput v-bind="props" :class="$attrs.class" :style="$attrs.style">
    <NvInput
      ref="inputRef"
      v-bind="inputAttrs"
      :size="props.size"
      :model-value="props.modelValue"
      type="number"
      @update:model-value="emit('update:modelValue', $event)"
      @input="emit('input', $event)"
      @change="emit('change', $event)"
      @focus="emit('focus', $event)"
      @blur="emit('blur', $event)"
    >
      <template v-for="(_, slot) of $slots" v-slot:[slot]="scope">
        <slot :name="slot" v-bind="scope || {}" />
      </template>
    </NvInput>
  </StNumberInput>
</template>
<script lang="ts" setup>
import { computed, ref, useAttrs } from 'vue'
import NvInput from '../Input/NvInput.vue'
import { StNumberInput } from './number-input.panda'
import { props as propsDefinition } from './number-input.shared'

defineOptions({ inheritAttrs: false })
const props = defineProps(propsDefinition)
const emit = defineEmits<{
  'update:modelValue': [value: string]
  input: [value: string]
  change: [value: string]
  focus: [event: FocusEvent]
  blur: [event: FocusEvent]
}>()
const attrs = useAttrs()
const inputAttrs = computed(() =>
  Object.fromEntries(
    Object.entries(attrs).filter(([key]) => key !== 'class' && key !== 'style'),
  ),
)
const inputRef = ref<InstanceType<typeof NvInput>>()
const input = computed(() => inputRef.value?.input)
defineExpose({
  input,
  focus: () => input.value?.focus(),
  blur: () => input.value?.blur(),
  select: () => input.value?.select(),
})
</script>
