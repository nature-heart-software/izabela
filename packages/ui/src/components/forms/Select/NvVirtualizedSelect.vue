<template>
  <StSelectV2
    ref="select"
    :isFocused="hasFocus"
    v-bind="props"
    @click="activate"
  >
    <StSelectV2Wrapper v-bind="props">
      <StSelectV2Input
        ref="selectInput"
        :isFocused="hasFocus"
        :modelValue="inputValue"
        :placeholder="$attrs.placeholder"
        @update:modelValue="search = $event"
      />
    </StSelectV2Wrapper>
    <StSelectV2Icon v-bind="props">
      <NvIcon :size="iconSize" name="direction" />
    </StSelectV2Icon>
  </StSelectV2>
  <NvAutocomplete :data="props.options" :valueKey="props.valueKey">
    <template #default="{ item, active }">
      <StSelectV2Option
        :active="active"
        :disabled="item.__disabled"
        :selected="selectedValues.includes(get(item, props.valueKey, item))"
        @click="handleValue(item)"
      >
        {{ item.display_name }}
      </StSelectV2Option>
    </template>
  </NvAutocomplete>
</template>
<script lang="ts" setup>
import { computed, defineProps, ref } from 'vue'
import { useFocusTrap } from '@vueuse/integrations/useFocusTrap'
import { onClickOutside } from '@vueuse/core'
import tokens from '@/styles/tokens'
import {
  StSelectV2,
  StSelectV2Icon,
  StSelectV2Input,
  StSelectV2Option,
  StSelectV2Wrapper,
} from './select.styled'
import { propsV2 as propsDefinition, Size, Value } from './select.shared'
import NvIcon from '@/components/typography/Icon/NvIcon.vue'
import NvAutocomplete from '@/components/forms/Autocomplete/NvAutocomplete.vue'
import { get } from 'lodash'

const props = defineProps(propsDefinition)
const emit = defineEmits(['update:modelValue'])
const iconSize = computed(() => {
  const sizes: Record<Size, keyof typeof tokens.spacing> = {
    sm: 3,
    md: 5,
    lg: 5,
  }
  return sizes[props.size]
})

const selectedValues = computed(() =>
  props.multiple ? (props.modelValue as Value[]) : [props.modelValue],
)
const selectedOptions = computed(() =>
  props.options.filter((option) =>
    selectedValues.value.includes(get(option, props.valueKey, option)),
  ),
)
const search = ref('')
const isFocused = ref(false)
const select = ref()
const selectInput = ref()
const { hasFocus, activate, deactivate } = useFocusTrap(select)
const inputValue = computed(
  () =>
    (!hasFocus.value &&
      !props.multiple &&
      get(
        selectedOptions.value[0],
        props.labelKey || props.valueKey,
        selectedOptions.value[0],
      )) ||
    search.value,
)
const handleValue = (value: Value) => {
  if (props.multiple) {
    const newValue = [...selectedValues.value]
    const index = newValue.findIndex(
      (item) =>
        get(item, props.valueKey, item) === get(value, props.valueKey, value),
    )
    if (index > -1) {
      newValue.splice(index, 1)
    } else {
      newValue.push(get(value, props.valueKey, value))
    }
    emit('update:modelValue', newValue)
  } else {
    emit('update:modelValue', get(value, props.valueKey, value))
  }
}
onClickOutside(select, () => {
  search.value = ''
  deactivate()
  setTimeout(() => {
    selectInput.value.$el.blur()
  })
})
</script>
