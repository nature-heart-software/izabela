<template>
  <NvSelect
    :options="options"
    v-bind="{
      modelValue: getProperty('selectedVoice'),
      'onUpdate:modelValue': (value) => setProperty('selectedVoice', purify(value)),
      ...$attrs,
    }"
    valueKey="name"
  />
</template>
<script lang="ts" setup>
import { computed } from 'vue'
import { NvSelect } from '@packages/ui'
import { purify } from '@packages/toolbox'
import { getProperty, setProperty } from './store'
import { voices } from './shared'

const options = computed(() => [
  {
    label: 'Custom',
    value: {
      name: 'Custom',
    },
  },
  ...voices.map((voice) => ({
    label: voice.name,
    value: voice,
  })),
])
console.log('options', options)
</script>
