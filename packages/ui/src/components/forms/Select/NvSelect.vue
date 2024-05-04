<template>
  <NvAutocomplete
      ref="autocomplete"
      :autoScrollIndex="autoScrollIndex"
      :options="searchResults"
      :valueKey="props.valueKey"
      :visible="hasFocus"
      :width="props.autocompleteWidth"
      @select="(item) => !item.children && handleValue(item.value)"
  >
    <template #reference>
      <StSelect
          ref="select"
          :isFocused="hasFocus"
          class="w-full"
          v-bind="{ ...props, isFocused: hasFocus }"
          @click="activate"
      >
        <StSelectWrapper class="w-full" v-bind="props">
          <NvStack :spacing="2" class="w-full">
            <template v-if="props.multiple && selectedOptions.length > 0">
              <StSelectTagsWrapper>
                <NvGroup :spacing="2" class="w-full">
                  <template
                      v-for="option in selectedOptions"
                      :key="get(option.value, props.valueKey) || option.value"
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
              </StSelectTagsWrapper>
            </template>
            <div ref="inputWrapper" class="inline-flex">
              <StSelectInput
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
        </StSelectWrapper>
        <StSelectIcon v-bind="props">
          <NvIcon :size="iconSize" name="direction"/>
        </StSelectIcon>
      </StSelect>
    </template>
    <template #default="{ active, item }">
      <NvOption
          v-if="item"
          :active="active"
          :disabled="item.disabled"
          :readonly="item.children"
          :selected="
          selectedValues.find(
            (v) =>
              (get(item.value, props.valueKey) || item.value) ===
              (get(v, props.valueKey) || v),
          )
        "
          :title="item.label"
          v-bind="item.attrs || {}"
          @mousedown="!item.children && handleValue(item.value)"
      >
        <div class="w-full text-ellipsis overflow-hidden">
          {{ item.label }}
        </div>
        <template #after="props">
          <slot :option="item" name="optionAfter" v-bind="props"/>
        </template>
      </NvOption>
    </template>
    <template #fallback>
      <StSelectOption
          v-if="searchResults.length === 0"
          class="justify-center pointer-events-none"
      >
        No Data
      </StSelectOption>
    </template>
  </NvAutocomplete>
</template>
<script lang="ts" setup>
import { computed, defineProps, onBeforeUnmount, ref } from 'vue'
import { useFocusTrap } from '@vueuse/integrations/useFocusTrap'
import { useFuse, UseFuseOptions } from '@vueuse/integrations/useFuse'
import { onClickOutside, onKeyStroke } from '@vueuse/core'
import tokens from '@/styles/tokens'
import {
  StSelect,
  StSelectIcon,
  StSelectInput,
  StSelectOption,
  StSelectTagsWrapper,
  StSelectWrapper,
} from './select.styled'
import { Option, selectProps as propsDefinition, Size, Value } from './select.shared'
import NvIcon from '@/components/typography/Icon/NvIcon.vue'
import NvAutocomplete from '@/components/forms/Autocomplete/NvAutocomplete.vue'
import NvTag from '@/components/forms/Tag/NvTag.vue'
import NvGroup from '@/components/miscellaneous/Group/NvGroup.vue'
import NvStack from '@/components/miscellaneous/Stack/NvStack.vue'
import NvOption from './NvOption.vue'
import flatten from 'lodash/flatten'
import get from 'lodash/get'
import omit from 'lodash/omit'
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
    flatten(
        props.options.map((option) => {
          if (option.children) {
            const mappedChildren = option.children.map((o) => ({
              id: get(o.value, props.valueKey) || o.value || uuid(),
              ...o,
            }))
            return [
              {
                id: get(option.value, props.valueKey) || option.value || uuid(),
                ...option,
                children: mappedChildren,
              },
              ...mappedChildren,
            ]
          }
          return {
            id: get(option.value, props.valueKey) || option.value || uuid(),
            ...option,
          }
        }),
    ),
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
const { hasFocus, activate, deactivate } = useFocusTrap(inputWrapper, {
  returnFocusOnDeactivate: false,
  onDeactivate() {
    if (selectInput.value) selectInput.value.$el.blur()
  },
})
const fuseOptions = computed<UseFuseOptions<(typeof options.value)[number]>>(
    () => ({
      fuseOptions: {
        keys: ['label', 'category', 'searchValue'],
        threshold: 0.3,
        shouldSort: false,
      },
    }),
)
const { results } = useFuse(search, options, fuseOptions)
const searchResults = computed(() => {
  if (search.value) {
    const filteredOptions = results.value.map(({ item }) => item) || []
    return options.value.filter((option) => {
      if ('children' in option) {
        return filteredOptions.some((o) =>
            (option.children as Option[]).find((c) => c.id === o.id),
        )
      }
      return filteredOptions.some((o) => o.id === option.id)
    })
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
          ...selectedValues.value
              .map((v) =>
                  options.value.findIndex(
                      (o) =>
                          get(o.value, props.valueKey, o.value) ===
                          get(v, props.valueKey, v),
                  ),
              )
              .filter((i) => i !== undefined),
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
}
onKeyStroke('Escape', blurInput)
onKeyStroke('Tab', blurInput)
onClickOutside(autocomplete, blurInput)
onBeforeUnmount(blurInput)
</script>
