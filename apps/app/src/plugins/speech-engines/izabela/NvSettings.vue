<template>
  <NvAccessBlocker
    :allowed="speechStore.hasUniversalApiCredentials"
    reason="Universal credentials required"
  >
    <NvFormItem label="Voice">
      <NvVoiceSelect />
    </NvFormItem>
  </NvAccessBlocker>
</template>
<script lang="ts" setup>
import { NvAccessBlocker, NvFormItem } from '@packages/ui'
import { useSpeechStore } from '@/features/speech/store'
import NvVoiceSelect from './NvVoiceSelect'

const speechStore = useSpeechStore()
</script>
