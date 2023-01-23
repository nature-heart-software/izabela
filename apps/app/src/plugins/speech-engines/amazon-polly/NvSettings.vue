<template>
  <NvAccessBlocker
    :allowed="
      speechStore.hasUniversalApiCredentials ||
      [getProperty('identityPoolId', true), getProperty('region')].every(Boolean)
    "
    reason="Credentials required"
  >
    <NvFormItem label="Voice">
      <NvVoiceSelect />
    </NvFormItem>
  </NvAccessBlocker>
  <NvDivider direction="horizontal" />
  <NvStack spacing="5">
    <NvFormItem label="Identity pool ID">
      <NvInput
        :modelValue="getProperty('identityPoolId', true)"
        show-password
        type="password"
        @update:modelValue="(value) => setProperty('identityPoolId', value, true)"
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
<script lang="ts" setup>
import { NvAccessBlocker, NvDivider, NvFormItem, NvInput, NvStack } from '@packages/ui'
import { useSpeechStore } from '@/features/speech/store'
import NvVoiceSelect from './NvVoiceSelect'
import { getProperty, setProperty } from './store'

const speechStore = useSpeechStore()
</script>
