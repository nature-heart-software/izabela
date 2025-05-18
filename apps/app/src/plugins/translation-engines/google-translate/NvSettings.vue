<template>
  <NvStack :spacing="size === 'sm' ? 4 : 5">
    <NvFormItem label="From">
      <NvTranslateFromSelect
        :modelValue="getProperty('translateFrom')"
        @update:modelValue="(value) => setProperty('translateFrom', value)"
      />
    </NvFormItem>
    <NvDivider direction="horizontal" />
    <NvFormItem label="To">
      <NvTranslateToSelect
        :modelValue="getProperty('translateTo')"
        @update:modelValue="(value) => setProperty('translateTo', value)"
      />
    </NvFormItem>
  </NvStack>
</template>
<script lang="ts" setup>
import { PropType } from 'vue'
import { NvDivider, NvFormItem, NvStack } from '@packages/ui'
import NvTranslateFromSelect from './NvTranslateFromSelect.vue'
import NvTranslateToSelect from './NvTranslateToSelect.vue'
import { store } from './store.ts'

const props = defineProps({
  size: {
    type: String as PropType<'sm' | 'md'>,
    default: 'md',
  },
  form: Object,
})
const { getProperty, setProperty } = store.useStoreOrForm(props.form)
</script>
