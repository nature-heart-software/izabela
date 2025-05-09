<template>
  <NvAccessBlocker
    :allowed="[getStoreProperty('apiKey', true)].every(Boolean)"
    reason="Credentials required"
  >
    <NvStack :spacing="size === 'sm' ? 4 : 5">
      <NvFormItem label="Prompt">
        <NvInput
          placeholder="Example: Translate into Shakespearean English..."
          :modelValue="getProperty('prompt')"
          @update:modelValue="(value) => setProperty('prompt', value)"
        />
      </NvFormItem>
      <NvDivider direction="horizontal" />
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
  </NvAccessBlocker>
  <template v-if="!form && size === 'md'">
    <NvDivider direction="horizontal" />
    <NvFormItem label="API Key">
      <NvInput
        :modelValue="getStoreProperty('apiKey', true)"
        show-password
        type="password"
        @update:modelValue="(value) => setStoreProperty('apiKey', value, true)"
      />
    </NvFormItem>
  </template>
</template>
<script lang="ts" setup>
import { PropType } from 'vue'
import {
  NvAccessBlocker,
  NvDivider,
  NvFormItem,
  NvInput,
  NvStack,
} from '@packages/ui'
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
const { getProperty, setProperty, getStoreProperty, setStoreProperty } =
  store.useStoreOrForm(props.form)
</script>
