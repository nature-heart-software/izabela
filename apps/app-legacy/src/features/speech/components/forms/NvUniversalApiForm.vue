<template>
  <NvStack spacing="5">
    <NvFormItem label="API Key">
      <NvInput
        :modelValue="decrypt(settingsStore.universalApiKey)"
        show-password
        type="password"
        @update:modelValue="(value) => settingsStore.$patch({ universalApiKey: encrypt(value) })"
      />
    </NvFormItem>
    <NvDivider direction="horizontal" />
    <NvFormItem label="API Endpoint">
      <NvInput
        :modelValue="settingsStore.universalApiEndpoint"
        @update:modelValue="(value) => settingsStore.$patch({ universalApiEndpoint: value })"
      />
    </NvFormItem>
  </NvStack>
</template>
<script lang="ts" setup>
import { NvDivider, NvFormItem, NvInput, NvStack } from '@packages/ui'
import { decrypt, encrypt } from '@/utils/security'
import { useSettingsStore } from '@/features/settings/store'

const settingsStore = useSettingsStore()
</script>
