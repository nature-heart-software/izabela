<template>
  <StInput v-bind="props" :class="$attrs.class" :style="$attrs.style">
    <slot name="prepend" />
    <span :class="classes.control">
      <span
        v-if="$slots.prefix"
        :class="classes.adornment"
        data-position="prefix"
        ><slot name="prefix"
      /></span>
      <input
        ref="input"
        v-bind="inputAttrs"
        :class="classes.input"
        :type="inputType"
        :value="props.modelValue ?? ''"
        :data-prefix="$slots.prefix ? '' : undefined"
        :data-suffix="hasSuffix ? '' : undefined"
        @input="onInput"
        @change="emit('change', ($event.target as HTMLInputElement).value)"
        @focus="emit('focus', $event)"
        @blur="emit('blur', $event)"
        @compositionstart="composing = true"
        @compositionend="onCompositionEnd"
      />
      <span v-if="hasSuffix" :class="classes.adornment" data-position="suffix">
        <slot name="suffix" />
        <button
          v-if="props.showPassword"
          type="button"
          :class="classes.action"
          :aria-label="passwordVisible ? 'Hide password' : 'Show password'"
          :aria-pressed="passwordVisible"
          :disabled="isDisabled"
          @click="passwordVisible = !passwordVisible"
        >
          <NvIcon
            :name="passwordVisible ? 'eye-slash' : 'eye'"
            :size="3"
            aria-hidden="true"
            focusable="false"
          />
        </button>
        <button
          v-if="canClear"
          type="button"
          :class="classes.action"
          aria-label="Clear input"
          @click="clear"
        >
          <span aria-hidden="true">×</span>
        </button>
      </span>
    </span>
    <slot name="append" />
    <slot />
  </StInput>
</template>
<script lang="ts" setup>
import { computed, ref, useAttrs, useSlots } from 'vue'
import { StInput, inputRecipe } from './input.panda'
import { props as propsDefinition } from './input.shared'
import NvIcon from '@/components/typography/Icon/NvIcon.vue'

defineOptions({ inheritAttrs: false })
const props = defineProps(propsDefinition)
const emit = defineEmits<{
  'update:modelValue': [value: string]
  input: [value: string]
  change: [value: string]
  focus: [event: FocusEvent]
  blur: [event: FocusEvent]
  clear: []
}>()
const attrs = useAttrs()
const slots = useSlots()
const input = ref<HTMLInputElement>()
const passwordVisible = ref(false)
const composing = ref(false)
const classes = computed(() => inputRecipe({ size: props.size }))
const inputAttrs = computed(() =>
  Object.fromEntries(
    Object.entries(attrs).filter(([key]) => key !== 'class' && key !== 'style'),
  ),
)
const inputType = computed(() =>
  props.showPassword
    ? passwordVisible.value
      ? 'text'
      : 'password'
    : (attrs.type as string) || 'text',
)
const isDisabled = computed(
  () => attrs.disabled === '' || Boolean(attrs.disabled),
)
const isReadonly = computed(
  () => attrs.readonly === '' || Boolean(attrs.readonly),
)
const canClear = computed(
  () =>
    props.clearable &&
    !isDisabled.value &&
    !isReadonly.value &&
    String(props.modelValue ?? '').length > 0,
)
const hasSuffix = computed(() =>
  Boolean(slots.suffix || props.showPassword || canClear.value),
)
function onInput(event: Event) {
  if (composing.value) return
  const value = (event.target as HTMLInputElement).value
  emit('update:modelValue', value)
  emit('input', value)
}
function onCompositionEnd(event: CompositionEvent) {
  if (!composing.value) return
  composing.value = false
  onInput(event)
}
function clear() {
  emit('update:modelValue', '')
  emit('input', '')
  emit('change', '')
  emit('clear')
  input.value?.focus()
}
defineExpose({
  input,
  focus: () => input.value?.focus(),
  blur: () => input.value?.blur(),
  select: () => input.value?.select(),
})
</script>
