<template>
  <NvAutocomplete
    ref="autocomplete"
    :autoScrollIndex="autoScrollIndex"
    :data="searchResults"
    :valueKey="props.valueKey"
    :visible="hasFocus"
    @select="(item) => handleValue(item)"
  >
    <template #reference>
      <StSelectV2
        ref="select"
        :isFocused="hasFocus"
        v-bind="{ ...props, isFocused: hasFocus }"
        @click="activate"
      >
        <StSelectV2Wrapper v-bind="props">
          <NvStack>
            <template v-if="props.multiple && selectedOptions.length > 0">
              <NvGroup :spacing="2">
                <template
                  v-for="option in selectedOptions"
                  :key="get(option, props.valueKey, option)"
                >
                  <NvTag
                    closable
                    @close="handleValue(option)"
                    @mousedown="blurInput()"
                    @click.stop
                  >
                    {{ get(option, props.labelKey, option) }}
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
        :disabled="get(item, '__disabled')"
        :selected="selectedValues.includes(get(item, props.valueKey, item))"
        @mousedown="handleValue(item)"
      >
        {{ get(item, props.labelKey, item) }}
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
  selectedValues.value.map((value) =>
    props.options.find(
      (option) => get(option, props.valueKey, option) === value,
    ),
  ),
)
const search = ref('')
const isFocused = ref(false)
const select = ref()
const selectInput = ref()
const inputWrapper = ref()
const autocomplete = ref()
const { hasFocus, activate, deactivate } = useFocusTrap(inputWrapper)
const fuseOptions = computed<UseFuseOptions<typeof props.options[number]>>(
  () => ({
    fuseOptions: {
      keys: [props.labelKey],
      threshold: 0.3,
    },
  }),
)
const { results } = useFuse(search, props.options, fuseOptions)
const searchResults = computed(() => {
  if (search.value) {
    return results.value.map(({ item }) => item) || []
  }
  return props.options || []
})
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

const autoScrollIndex = computed(() => {
  return (
    selectedValues.value.length > 0 &&
    Math.min(
      ...selectedValues.value.map((v) =>
        props.options.findIndex((o) => get(o, props.valueKey, o) === v),
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
      newValue.push(get(value, props.valueKey, value))
    }
    emit('update:modelValue', newValue)
  } else {
    emit('update:modelValue', get(value, props.valueKey, value))
    blurInput()
  }
}
const blurInput = () => {
  search.value = ''
  deactivate()
  setTimeout(() => {
    selectInput.value.$el.blur()
  })
}
onKeyStroke('Escape', blurInput)
onKeyStroke('Tab', blurInput)
onClickOutside(autocomplete, () => {
  blurInput()
})
</script>
