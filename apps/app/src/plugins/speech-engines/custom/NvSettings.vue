<template>
  <NvAccessBlocker :allowed="!!getProperty('endpoint')"
                   reason="Endpoint and/or credentials required">
    <NvFormItem label="Voice">
      <NvVoiceSelect placeholder="Select a voice"/>
    </NvFormItem>
  </NvAccessBlocker>
  <NvDivider direction="horizontal"/>
  <NvFormItem label="API Endpoint">
    <NvInput
      :modelValue="getProperty('endpoint')"
      @update:modelValue="(value) => setProperty('endpoint', value)"
    />
  </NvFormItem>
  <NvDivider direction="horizontal"/>
  <NvFormItem label="API Key">
    <NvInput
      :modelValue="getProperty('apiKey', true)"
      show-password
      type="password"
      @update:modelValue="(value) => setProperty('apiKey', value, true)"
    />
  </NvFormItem>
</template>
<script lang="ts" setup>
import { NvAccessBlocker, NvDivider, NvFormItem, NvInput } from '@packages/ui'
import NvVoiceSelect from './NvVoiceSelect'
import { getProperty, setProperty } from './store'</script>
