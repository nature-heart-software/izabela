<template>
  <NvAccessBlocker
    :allowed="
      (speechStore.hasUniversalApiCredentials && !getProperty('useLocalCredentials')) ||
      [getProperty('apiKey', true), getProperty('url')].every(Boolean)
    "
    reason="Credentials required"
  >
    <NvFormItem label="Voice">
      <NvVoiceSelect/>
    </NvFormItem>
  </NvAccessBlocker>
  <template v-if="speechStore.hasUniversalApiCredentials">
    <NvDivider direction="horizontal"/>
    <NvGroup justify="apart" no-wrap spacing="5">
      <NvStack>
        <NvText type="label">Use my own credentials</NvText>
      </NvStack>
      <NvSwitch
        :modelValue="getProperty('useLocalCredentials')"
        @update:modelValue="(value) => setProperty('useLocalCredentials', value)"
      />
    </NvGroup>
  </template>
  <template v-if="getProperty('useLocalCredentials') || !speechStore.hasUniversalApiCredentials">
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
    <NvDivider direction="horizontal"/>
    <NvStack spacing="5">
      <NvFormItem label="Url">
        <NvInput
          :modelValue="getProperty('url')"
          @update:modelValue="(value) => setProperty('url', value)"
        />
      </NvFormItem>
    </NvStack>
  </template>
</template>
<script lang="ts" setup>
import {
  NvAccessBlocker,
  NvDivider,
  NvFormItem,
  NvGroup,
  NvInput,
  NvStack,
  NvSwitch,
  NvText,
} from '@packages/ui'
import { useSpeechStore } from '@/features/speech/store'
import NvVoiceSelect from './NvVoiceSelect'
import { getProperty, setProperty } from './store'

const speechStore = useSpeechStore()
</script>
