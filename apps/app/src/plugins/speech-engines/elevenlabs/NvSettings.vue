<template>
  <NvAccessBlocker
    :allowed="!!getProperty('apiKey', true)"
    reason="Credentials required"
  >
    <NvFormItem label="Voice">
      <NvVoiceSelect/>
    </NvFormItem>
  </NvAccessBlocker>
  <NvDivider direction="horizontal"/>
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
</template>
<script lang="ts" setup>
import { NvAccessBlocker, NvDivider, NvFormItem, NvInput, NvStack } from '@packages/ui'
import { useSpeechStore } from '@/features/speech/store'
import NvVoiceSelect from './NvVoiceSelect'
import { getProperty, setProperty } from './store'

const speechStore = useSpeechStore()
</script>
