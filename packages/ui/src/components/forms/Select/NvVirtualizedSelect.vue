<template>
  <NvAutocomplete
    ref="autocomplete"
    :autoScrollIndex="autoScrollIndex"
    :data="searchResults"
    :valueKey="'id'"
    :visible="hasFocus"
    @select="(item) => handleValue(item.value)"
  >
    <template #reference>
      <StSelectV2
        ref="select"
        :isFocused="hasFocus"
        class="w-full"
        v-bind="{ ...props, isFocused: hasFocus }"
        @click="activate"
      >
        <StSelectV2Wrapper class="w-full" v-bind="props">
          <NvStack class="w-full">
            <template v-if="props.multiple && selectedOptions.length > 0">
              <NvGroup :spacing="2" class="w-full">
                <template
                  v-for="option in selectedOptions"
                  :key="get(option.value, props.valueKey, option.value)"
                >
                  <NvTag
                    :title="option.label"
                    closable
                    @close="handleValue(option.value)"
                    @mousedown="blurInput()"
                    @click.stop
                  >
                    {{ option.label }}
                  </NvTag>
                </template>
              </NvGroup>
            </template>
            <div ref="inputWrapper" class="inline-flex">
              <StSelectV2Input
                ref="selectInput"
                :isFocused="hasFocus"
                :modelValue="inputValue"
                :placeholder="$attrs.placeholder"
                v-bind="omit(props, ['modelValue'])"
                @focus="activate"
                @update:modelValue="search = $event"
              />
            </div>
          </NvStack>
        </StSelectV2Wrapper>
        <StSelectV2Icon v-bind="props">
          <NvIcon :size="iconSize" name="direction" />
        </StSelectV2Icon>
      </StSelectV2>
    </template>
    <template #default="{ item, active }">
      <StSelectV2Option
        :active="active"
        :disabled="item.disabled"
        :selected="
          selectedValues.find(
            (v) =>
              get(item.value, props.valueKey, item.value) ===
              get(v, props.valueKey, v),
          )
        "
        :title="item.label"
        v-bind="item.attrs || {}"
        @mousedown="handleValue(item.value)"
      >
        <div class="w-full text-ellipsis overflow-hidden">
          {{ item.label }}
        </div>
      </StSelectV2Option>
    </template>
  </NvAutocomplete>
</template>
<script lang="ts" setup>
import { computed, defineProps, ref } from 'vue'
import { useFocusTrap } from '@vueuse/integrations/useFocusTrap'
import { useFuse, UseFuseOptions } from '@vueuse/integrations/useFuse'
import { onClickOutside, onKeyStroke } from '@vueuse/core'
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
import NvTag from '@/components/forms/Tag/NvTag.vue'
import NvGroup from '@/components/miscellaneous/Group/NvGroup.vue'
import NvStack from '@/components/miscellaneous/Stack/NvStack.vue'
import { get, omit } from 'lodash'
import { v4 as uuid } from 'uuid'

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

const options = computed(() =>
  props.options.map((option) => ({
    id: get(option.value, props.valueKey, option.value) || uuid(),
    ...option,
  })),
)

const selectedOptions = computed(() =>
  selectedValues.value
    .map((value) =>
      options.value.find(
        (option) =>
          get(option.value, props.valueKey, option.value) ===
          get(value, props.valueKey, value),
      ),
    )
    .filter((option) => option !== undefined),
)

const search = ref('')
const isFocused = ref(false)
const select = ref()
const selectInput = ref()
const inputWrapper = ref()
const autocomplete = ref()
const { hasFocus, activate, deactivate } = useFocusTrap(inputWrapper)
const fuseOptions = computed<UseFuseOptions<typeof options.value[number]>>(
  () => ({
    fuseOptions: {
      keys: ['label'],
      threshold: 0.3,
    },
  }),
)
const { results } = useFuse(search, options, fuseOptions)
const searchResults = computed(() => {
  if (search.value) {
    return results.value.map(({ item }) => item) || []
  }
  return options.value || []
})
const inputValue = computed(
  () =>
    (!hasFocus.value && !props.multiple && selectedOptions.value[0]?.label) ||
    search.value,
)

const autoScrollIndex = computed(() => {
  return (
    selectedValues.value.length > 0 &&
    Math.min(
      ...selectedValues.value.map((v) =>
        options.value.findIndex(
          (o) => get(o, props.valueKey, o) === get(v, props.valueKey, v),
        ),
      ),
    )
  )
})

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
      newValue.push(value)
    }
    emit('update:modelValue', newValue)
  } else {
    emit('update:modelValue', value)
    blurInput()
  }
}
const blurInput = () => {
  search.value = ''
  deactivate()
  setTimeout(() => {
    if (selectInput.value) {
      selectInput.value.$el.blur()
    }
  })
}
onKeyStroke('Escape', blurInput)
onKeyStroke('Tab', blurInput)
onClickOutside(autocomplete, () => {
  blurInput()
})
</script>
