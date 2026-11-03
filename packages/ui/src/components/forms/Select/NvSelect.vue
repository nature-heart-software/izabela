<template>
  <NvAutocomplete
    :class="$attrs.class"
    :style="$attrs.style"
    :placement="props.placement"
    :autoScrollIndex="autoScrollIndex"
    :options="searchResults"
    :valueKey="props.valueKey"
    :visible="isAutocompleteVisible"
    :width="props.autocompleteWidth"
    @select="selectOption"
    @positioner-change="autocomplete = $event"
    @pointer-down-outside="blurInput"
    @focus-outside="blurInput"
    @interact-outside="blurInput"
  >
    <template #reference>
      <StSelect
        ref="select"
        :class="box({ width: '100%' })"
        v-bind="{ ...props, isFocused: hasFocus }"
        @click="activate"
      >
        <StSelectWrapper :class="box({ width: '100%' })" v-bind="props">
          <NvStack :spacing="2" :class="box({ width: '100%' })">
            <template v-if="props.multiple && selectedOptions.length > 0">
              <StSelectTagsWrapper>
                <NvGroup :spacing="2" :class="box({ width: '100%' })">
                  <template
                    v-for="option in selectedOptions"
                    :key="get(option.value, props.valueKey) || option.value"
                  >
                    <NvTag
                      :title="option.label"
                      :closable="
                        !isLocked && !option.disabled && !option.readonly
                      "
                      @close="selectOption(option)"
                      @mousedown="blurInput()"
                      @click.stop
                    >
                      {{ option.label }}
                    </NvTag>
                  </template>
                </NvGroup>
              </StSelectTagsWrapper>
            </template>
            <div ref="inputWrapper" :class="box({ display: 'inline-flex' })">
              <StSelectInput
                ref="selectInput"
                :isFocused="hasFocus"
                :modelValue="inputValue"
                v-bind="{
                  ...omit(props, ['modelValue', 'isFocused']),
                  ...inputAttrs,
                }"
                @focus="activate"
                @update:modelValue="updateSearch"
              />
            </div>
          </NvStack>
        </StSelectWrapper>
        <StSelectIcon v-bind="props">
          <NvIcon :size="iconSize" name="direction" />
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
          selectedValues.some(
            (v: Value) =>
              (get(item.value, props.valueKey) || item.value) ===
              (get(v, props.valueKey) || v),
          )
        "
        :title="item.label"
        v-bind="item.attrs || {}"
        @click="selectOption(item)"
      >
        <div
          :class="
            box({ width: '100%', textOverflow: 'ellipsis', overflow: 'hidden' })
          "
        >
          {{ item.label }}
        </div>
        <template #after="props">
          <slot :option="item" name="optionAfter" v-bind="props" />
        </template>
      </NvOption>
    </template>
    <template #fallback>
      <StSelectOption
        v-if="searchResults.length === 0"
        :class="box({ justifyContent: 'center', pointerEvents: 'none' })"
      >
        No Data
      </StSelectOption>
    </template>
  </NvAutocomplete>
</template>
<script lang="ts" setup>
import { computed, onBeforeUnmount, ref, useAttrs, watch } from 'vue'
import { box } from '@/styled-system/patterns'
import { useFocusTrap } from '@vueuse/integrations/useFocusTrap'
import { useFuse, UseFuseOptions } from '@vueuse/integrations/useFuse'
import { onClickOutside, onKeyStroke } from '@vueuse/core'
import { tokens } from '@/styles/tokens'
import {
  StSelect,
  StSelectIcon,
  StSelectInput,
  StSelectOption,
  StSelectTagsWrapper,
  StSelectWrapper,
} from './select.panda'
import {
  Option,
  selectProps as propsDefinition,
  Size,
  Value,
} from './select.shared'
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
defineOptions({ inheritAttrs: false })
const attrs = useAttrs()
const inputAttrs = computed(() => omit(attrs, ['class', 'style']))
const isLocked = computed(() => props.disabled || props.readonly)
const emit = defineEmits(['update:modelValue'])
const iconSize = computed(() => {
  const sizes: Record<Size, keyof typeof tokens.fontSize> = {
    sm: 3,
    md: 5,
    lg: 5,
  }
  return sizes[props.size]
})

const selectedValues = computed(() =>
  props.multiple ? (props.modelValue as Value[]) : [props.modelValue],
)

const options = computed<Option[]>(() =>
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
const {
  hasFocus,
  activate: activateTrap,
  deactivate,
} = useFocusTrap(inputWrapper, {
  returnFocusOnDeactivate: false,
  allowOutsideClick: true,
  preventScroll: true,
  onDeactivate() {
    if (selectInput.value) selectInput.value.$el.blur()
  },
})

const isAutocompleteVisible = ref(false)
const activate = () => {
  if (!isLocked.value) activateTrap()
}
const updateSearch = (value: string) => {
  if (!isLocked.value) search.value = value
  else if (selectInput.value?.$el)
    selectInput.value.$el.value = inputValue.value
}

watch(
  () => hasFocus.value,
  (value) => {
    if (value && !isLocked.value) {
      isAutocompleteVisible.value = true
    }
  },
)

const fuseOptions = computed<UseFuseOptions<typeof options.value[number]>>(
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
  const indices = selectedValues.value
    .map((value) =>
      searchResults.value.findIndex(
        (option) =>
          get(option.value, props.valueKey, option.value) ===
          get(value, props.valueKey, value),
      ),
    )
    .filter((index) => index >= 0)
  return indices.length > 0 ? Math.min(...indices) : undefined
})

const handleValue = (value: Value) => {
  if (isLocked.value) return
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
const selectOption = (item?: Option) => {
  if (
    !item ||
    item.children ||
    item.disabled ||
    item.readonly ||
    isLocked.value
  )
    return
  handleValue(item.value)
}
const blurInput = () => {
  search.value = ''
  deactivate()
  isAutocompleteVisible.value = false
}
watch(isLocked, (locked) => {
  if (locked) blurInput()
})
onKeyStroke('Escape', blurInput)
onKeyStroke('Tab', blurInput)
onBeforeUnmount(blurInput)
</script>
