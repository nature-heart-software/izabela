<template>
  <NvAccessBlocker
    :allowed="!!store.getProperty('endpoint')"
    reason="Endpoint and/or credentials required"
  >
    <NvStack :spacing="size === 'sm' ? 4 : 5">
      <NvFormItem label="From">
        <NvTranslateFromSelect
          v-bind="{
            ...(form
              ? {
                  modelValue: form[store.getPropertyPath('translateFrom')],
                  'onUpdate:modelValue': (value) =>
                    (form[store.getPropertyPath('translateFrom')] = value),
                }
              : {
                  modelValue: store.getProperty('translateFrom'),
                  'onUpdate:modelValue': (value) =>
                    store.setProperty('translateFrom', value),
                }),
          }"
        />
      </NvFormItem>
      <NvDivider direction="horizontal" />
      <NvFormItem label="To">
        <NvTranslateToSelect
          v-bind="{
            ...(form
              ? {
                  modelValue: form[store.getPropertyPath('translateTo')],
                  'onUpdate:modelValue': (value) =>
                    (form[store.getPropertyPath('translateTo')] = value),
                }
              : {
                  modelValue: store.getProperty('translateTo'),
                  'onUpdate:modelValue': (value) =>
                    store.setProperty('translateTo', value),
                }),
          }"
        />
      </NvFormItem>
    </NvStack>
  </NvAccessBlocker>
</template>
<script lang="ts" setup>
import { PropType } from 'vue'
import { NvAccessBlocker, NvDivider, NvFormItem, NvStack } from '@packages/ui'
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
</script>
