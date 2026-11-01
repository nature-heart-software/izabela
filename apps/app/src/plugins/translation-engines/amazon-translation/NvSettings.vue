<template>
  <NvAccessBlocker
    :allowed="engine.hasCredentials()"
    reason="Credentials required"
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
    <NvStack spacing="5">
      <NvFormItem label="Identity Pool ID">
        <NvInput
          :modelValue="getProperty('identityPoolId', true)"
          show-password
          type="password"
          @update:modelValue="
            (value) => setProperty('identityPoolId', value, true)
          "
        />
      </NvFormItem>
    </NvStack>
    <NvDivider direction="horizontal" />
    <NvStack spacing="5">
      <NvFormItem label="Region">
        <NvInput
          :modelValue="getProperty('region')"
          @update:modelValue="(value) => setProperty('region', value)"
        />
      </NvFormItem>
    </NvStack>
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
import { engine } from './register.ts'

const props = defineProps({
  size: {
    type: String as PropType<'sm' | 'md'>,
    default: 'md',
  },
  form: Object,
})
const { getProperty, setProperty, getStoreProperty } = store.useStoreOrForm(
  props.form,
)
</script>
