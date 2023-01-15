<template>
  <NvAccessBlocker
    :allowed="speechStore.hasUniversalApiCredentials || [getProperty('publicKey', true), getProperty('privateKey', true)].every(Boolean)"
    reason="Credentials required"
  >
    <NvFormItem label="Voice">
      <NvVoiceSelect/>
    </NvFormItem>
  </NvAccessBlocker>
  <NvDivider direction="horizontal"/>
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
</template>
<script lang="ts" setup>
import { NvAccessBlocker, NvDivider, NvFormItem, NvInput, NvStack } from '@packages/ui'
import { useSpeechStore } from '@/features/speech/store'
import NvVoiceSelect from './NvVoiceSelect'
import { getProperty, setProperty } from './store'

const speechStore = useSpeechStore()
</script>
