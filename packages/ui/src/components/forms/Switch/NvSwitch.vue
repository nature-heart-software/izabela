<template>
  <StSwitch v-bind="props" :class="$attrs.class" :style="$attrs.style">
    <Switch.RootProvider :value="switchApi" :class="classes.label">
      <Switch.Control :class="classes.control"
        ><Switch.Thumb :class="classes.thumb"
      /></Switch.Control>
      <Switch.Label v-if="$slots.default"><slot /></Switch.Label>
      <Switch.HiddenInput
        v-bind="inputAttrs"
        role="switch"
        :aria-checked="props.modelValue"
        :aria-readonly="props.readonly || undefined"
        :aria-labelledby="
          ($attrs['aria-labelledby'] as string | undefined) ||
          ($slots.default ? switchApi.getLabelProps().id : undefined)
        "
      />
    </Switch.RootProvider>
  </StSwitch>
</template>
<script lang="ts" setup>
import { computed, useAttrs } from 'vue'
import { Switch, useSwitch } from '@ark-ui/vue'
import { StSwitch, switchRecipe } from './switch.panda'
import { props as propsDefinition } from './switch.shared'

defineOptions({ inheritAttrs: false })
const props = defineProps(propsDefinition)
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()
const attrs = useAttrs()
const classes = switchRecipe()
const inputAttrs = computed(() =>
  Object.fromEntries(
    Object.entries(attrs).filter(
      ([key]) =>
        !['class', 'style', 'id', 'name', 'form', 'required', 'value'].includes(
          key,
        ),
    ),
  ),
)
const switchApi = useSwitch({
  get checked() {
    return props.modelValue
  },
  get disabled() {
    return props.disabled
  },
  get readOnly() {
    return props.readonly
  },
  get ids() {
    return attrs.id ? { hiddenInput: String(attrs.id) } : undefined
  },
  get name() {
    return attrs.name as string | undefined
  },
  get form() {
    return attrs.form as string | undefined
  },
  get required() {
    return attrs.required === '' || Boolean(attrs.required)
  },
  get value() {
    return attrs.value as string | undefined
  },
  onCheckedChange({ checked }) {
    emit('update:modelValue', checked)
  },
})
</script>
