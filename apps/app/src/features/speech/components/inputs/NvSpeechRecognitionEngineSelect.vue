<template>
  <NvSelect
    :modelValue="settingsStore.selectedSpeechRecognitionEngine"
    :options="options"
    v-bind="$attrs"
    @update:modelValue="
      (value) =>
        settingsStore.$patch({ selectedSpeechRecognitionEngine: value })
    "
  />
</template>
<script lang="ts" setup>
import { NvSelect } from '@packages/ui'
import { computed } from 'vue'
import orderBy from 'lodash/orderBy'
import { useSettingsStore } from '@/features/settings/store'

const options = computed(() =>
  orderBy(
    [
      { label: 'Google Cloud', value: 'google-cloud' },
      { label: 'Microsoft Azure', value: 'microsoft-azure' },
      { label: 'Amazon Transcribe', value: 'amazon-transcribe' },
      { label: 'IBM Watson', value: 'ibm-watson' },
      { label: 'OpenAI', value: 'openai' },
      { label: 'Elevenlabs', value: 'elevenlabs' },
      { label: 'Custom', value: 'custom' },
    ].map(({ label, value }) => {
      return {
        label,
        value,
      }
    }),
  ),
)

const settingsStore = useSettingsStore()
</script>
