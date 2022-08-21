<template>
  <NvStack spacing="5">
    <NvFormItem label="API Key">
      <NvInput
        :modelValue="getProperty('apiKey', true)"
        show-password
        type="password"
        @update:modelValue="(value) => setProperty('apiKey', value, true)"
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
  <NvDivider direction="horizontal" />
  <NvAccessBlocker
    :allowed="[getProperty('apiKey', true), getProperty('region')].every(Boolean)"
    reason="Credentials required"
  >
    <NvFormItem label="Voice">
      <NvVoiceSelect />
    </NvFormItem>
  </NvAccessBlocker>
</template>
<script lang="ts" setup>
import { NvAccessBlocker, NvDivider, NvFormItem, NvInput, NvStack } from '@packages/ui'
import NvVoiceSelect from './NvVoiceSelect'
import { getProperty, setProperty } from './store'
</script>
