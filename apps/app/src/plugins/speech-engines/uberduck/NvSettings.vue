<template>
  <NvStack spacing="5">
    <NvFormItem label="Public API Key">
      <NvInput
        :modelValue="getProperty('publicKey', true)"
        show-password
        type="password"
        @update:modelValue="(value) => setProperty('publicKey', value, true)"
      />
    </NvFormItem>
  </NvStack>
  <NvDivider direction="horizontal"/>
  <NvStack spacing="5">
    <NvFormItem label="Private API Key">
      <NvInput
        :modelValue="getProperty('privateKey', true)"
        show-password
        type="password"
        @update:modelValue="(value) => setProperty('privateKey', value, true)"
      />
    </NvFormItem>
  </NvStack>
  <NvDivider direction="horizontal"/>
  <NvAccessBlocker
    :allowed="[getProperty('publicKey', true), getProperty('privateKey', true)].every(Boolean)"
    reason="Credentials required"
  >
    <NvFormItem label="Voice">
      <NvVoiceSelect/>
    </NvFormItem>
  </NvAccessBlocker>
</template>
<script lang="ts" setup>
import { NvAccessBlocker, NvDivider, NvFormItem, NvInput, NvStack } from '@packages/ui'
import NvVoiceSelect from './NvVoiceSelect'
import { getProperty, setProperty } from './store'</script>
