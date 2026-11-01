<template>
  <NvAccessBlocker
    :allowed="!!getStoreProperty('endpoint')"
    reason="Endpoint and/or credentials required"
  >
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
  </NvAccessBlocker>

  <template v-if="!form && size === 'md'">
    <NvDivider direction="horizontal" />
    <NvFormItem label="API Endpoint">
      <NvInput
        :modelValue="getStoreProperty('endpoint')"
        @update:modelValue="(value) => setStoreProperty('endpoint', value)"
      />
    </NvFormItem>
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
import { PropType, watch } from 'vue'
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
import { useQueryClient } from 'vue-query'
import { getLanguagesQueryKey } from './queries'

const props = defineProps({
  size: {
    type: String as PropType<'sm' | 'md'>,
    default: 'md',
  },
  form: Object,
})
const { getProperty, setProperty, getStoreProperty, setStoreProperty } =
  store.useStoreOrForm(props.form)

const queryClient = useQueryClient()
watch(
  () => [getStoreProperty('endpoint'), getStoreProperty('apiKey')],
  () => {
    queryClient.invalidateQueries(getLanguagesQueryKey())
  },
  { deep: true },
)
</script>
