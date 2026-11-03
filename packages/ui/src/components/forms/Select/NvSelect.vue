<template>
  <Combobox.RootProvider :value="combobox" as-child>
    <NvAutocomplete
      :class="$attrs.class"
      :style="$attrs.style"
      :placement="props.placement"
      :autoScrollIndex="autoScrollIndex"
      :options="searchResults"
      :valueKey="props.valueKey"
      :visible="isAutocompleteVisible"
      :width="props.autocompleteWidth"
      :keyboardNavigation="false"
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
                <Combobox.Input as-child>
                  <StSelectInput
                    ref="selectInput"
                    :isFocused="hasFocus"
                    :modelValue="inputValue"
                    v-bind="{
                      ...omit(props, ['modelValue', 'isFocused']),
                      ...inputAttrs,
                    }"
                    @focus="onInputFocus"
                    @update:modelValue="updateSearch"
                  />
                </Combobox.Input>
              </div>
            </NvStack>
          </StSelectWrapper>
          <StSelectIcon v-bind="props">
            <NvIcon :size="iconSize" name="direction" />
          </StSelectIcon>
        </StSelect>
      </template>
      <template #list>
        <NvSelectList
          ref="optionList"
          :rows="searchResults"
          @visible="onListVisible"
        >
          <template #default="{ active, item }">
            <NvOption
              v-if="item"
              :active="active"
              :disabled="item.disabled"
              :readonly="item.readonly"
              :selected="
                selectedValues.some(
                  (v: Value) =>
                    (get(item.value, props.valueKey) || item.value) ===
                    (get(v, props.valueKey) || v),
                )
              "
              :title="item.label"
              v-bind="item.attrs || {}"
            >
              <div
                :class="
                  box({
                    width: '100%',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                  })
                "
              >
                {{ item.label }}
              </div>
              <template #after="props">
                <slot :option="item" name="optionAfter" v-bind="props" />
              </template>
            </NvOption>
          </template>
        </NvSelectList>
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
  </Combobox.RootProvider>
</template>
<script lang="ts" setup>
import {
  computed,
  nextTick,
  onBeforeUnmount,
  reactive,
  ref,
  useAttrs,
  watch,
} from 'vue'
import { Combobox, useCombobox } from '@ark-ui/vue'
import { box } from '@/styled-system/patterns'
import { useFocusTrap } from '@vueuse/integrations/useFocusTrap'
import { useFuse, UseFuseOptions } from '@vueuse/integrations/useFuse'
import { onKeyStroke } from '@vueuse/core'
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
  SelectOption,
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
import NvSelectList from './NvSelectList.vue'
import flatten from 'lodash/flatten'
import get from 'lodash/get'
import omit from 'lodash/omit'

const props = defineProps(propsDefinition)
defineOptions({ inheritAttrs: false })
const attrs = useAttrs()
const inputAttrs = computed(() => omit(attrs, ['class', 'style']))
const isLocked = computed(() => props.disabled || props.readonly)
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

const options = computed<SelectOption[]>(() =>
  flatten(
    props.options.map((option, index) => {
      if (option.children) {
        const mappedChildren = option.children.map((o, childIndex) => ({
          ...o,
          key: `option-${index}-${childIndex}`,
        }))
        return [
          {
            ...option,
            key: `group-${index}`,
            children: mappedChildren,
          },
          ...mappedChildren,
        ]
      }
      return {
        ...option,
        key: `option-${index}`,
      }
    }),
  ),
)

const selectedOptions = computed(() =>
  selectedValues.value
    .map((value) =>
      options.value.find(
        (option) =>
          !option.children &&
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
let closing = false
let closingFrame = 0
const activate = () => {
  closing = false
  cancelAnimationFrame(closingFrame)
  if (!isLocked.value) activateTrap()
}
function onInputFocus(event: FocusEvent) {
  if (closing) {
    // A user may already be typing in another field when Ark's close callback
    // restores focus. Return it to that field instead of leaving focus on body.
    const previous = event.relatedTarget
    selectInput.value?.$el.blur()
    if (previous instanceof HTMLElement) previous.focus({ preventScroll: true })
  } else activate()
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
          (option.children as SelectOption[]).find((c) => c.key === o.key),
        )
      }
      return filteredOptions.some((o) => o.key === option.key)
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
          !option.children &&
          get(option.value, props.valueKey, option.value) ===
            get(value, props.valueKey, value),
      ),
    )
    .filter((index) => index >= 0)
  return indices.length > 0 ? Math.min(...indices) : undefined
})

const optionList = ref<InstanceType<typeof NvSelectList>>()
const collectionItems = computed(() =>
  searchResults.value.filter((item) => !item.children),
)
const highlightedValue = ref<string | null>(null)
const combobox = useCombobox<SelectOption>(
  reactive({
    items: collectionItems,
    itemToString: (item: SelectOption) => item.label,
    itemToValue: (item: SelectOption) => item.key,
    isItemDisabled: (item: SelectOption) => !!(item.disabled || item.readonly),
    modelValue: computed(() => selectedOptions.value.map((item) => item!.key)),
    inputValue,
    open: isAutocompleteVisible,
    highlightedValue,
    disabled: computed(() => props.disabled),
    readOnly: computed(() => props.readonly),
    multiple: computed(() => props.multiple),
    closeOnSelect: computed(() => !props.multiple),
    inputBehavior: 'autohighlight' as const,
    selectionBehavior: 'preserve' as const,
    loopFocus: true,
    openOnChange: false,
    // NvAutocomplete owns positioning, nested layers and the dismissal shield.
    disableLayer: true,
    ids: computed(() => ({
      input: typeof attrs.id === 'string' ? attrs.id : undefined,
    })),
    onInputValueChange: ({ inputValue }: { inputValue: string }) =>
      updateSearch(inputValue),
    onOpenChange: ({ open }: { open: boolean }) => {
      if (!open) blurInput()
      else if (!isLocked.value && hasFocus.value)
        isAutocompleteVisible.value = true
    },
    onHighlightChange: (details: { highlightedValue: string | null }) => {
      highlightedValue.value = details.highlightedValue
    },
    onValueChange: ({ value }: { value: string[] }) => {
      if (isLocked.value) return
      const previous = selectedOptions.value.map((item) => item!.key)
      const changed =
        value.find((id) => !previous.includes(id)) ??
        previous.find((id) => !value.includes(id))
      // Favorites and catalog groups may repeat one public value. Their DOM IDs
      // stay unique while selection still toggles that public value only once.
      selectOption(options.value.find((item) => item.key === changed))
    },
    scrollToIndexFn: ({ index }: { index: number }) => {
      const item = collectionItems.value[index]
      const row = item ? searchResults.value.indexOf(item) : -1
      if (row >= 0) optionList.value?.scrollToIndex(row)
    },
  }),
)
function onListVisible() {
  const index = autoScrollIndex.value
  const item = index === undefined ? undefined : searchResults.value[index]
  highlightedValue.value =
    item && !item.disabled && !item.readonly ? item.key : null
  if (index !== undefined) optionList.value?.scrollToIndex(index)
}
watch(searchResults, async () => {
  if (!isAutocompleteVisible.value || !search.value) return
  await nextTick()
  const item = collectionItems.value.find(
    (item) => !item.disabled && !item.readonly,
  )
  highlightedValue.value = item ? item.key : null
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
  // Ark restores focus in the next frame after closing. Preserve this control's
  // blur-on-dismiss contract without treating that restoration as a new open.
  if (!closing) {
    closing = true
    closingFrame = requestAnimationFrame(() => {
      closingFrame = requestAnimationFrame(() => {
        closing = false
      })
    })
  }
  search.value = ''
  deactivate()
  isAutocompleteVisible.value = false
}
watch(isLocked, (locked) => {
  if (locked) blurInput()
})
onKeyStroke('Escape', blurInput)
onKeyStroke('Tab', blurInput)
onBeforeUnmount(() => {
  blurInput()
  cancelAnimationFrame(closingFrame)
})
</script>
