<template>
  <NvSelect
    :options="options"
    v-bind="{
      modelValue: store.getProperty('model'),
      'onUpdate:modelValue': (value) => store.setProperty('model', value),
      ...$attrs,
    }"
  />
</template>
<script lang="ts" setup>
import { NvSelect } from '@packages/ui'
import { store } from './store'

const options = [
  { label: 'gpt-4o-transcribe', value: 'gpt-4o-transcribe' },
  { label: 'gpt-4o-transcribe-diarize', value: 'gpt-4o-transcribe-diarize' },
  { label: 'gpt-4o-mini-transcribe', value: 'gpt-4o-mini-transcribe' },
  {
    label: 'gpt-4o-mini-transcribe-2025-12-15',
    value: 'gpt-4o-mini-transcribe-2025-12-15',
  },
  { label: 'whisper-1', value: 'whisper-1' },
]
</script>
