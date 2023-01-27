<template>
  <NvSelect
    v-loading="isFetching"
    :options="options"
    v-bind="{
      modelValue: getProperty('selectedVoice'),
      'onUpdate:modelValue': (value) => setProperty('selectedVoice', value),
      ...$attrs,
    }"
    valueKey="name"
  />
</template>
<script lang="ts" setup>
import { computed } from 'vue'
import { NvSelect } from '@packages/ui'
import { getProperty, setProperty } from './store'
import { defaultVoice } from './shared'

const options = computed(() => [
  {
    label: 'Custom', value: {
      name: 'Custom',
    }
  },
  {
    label: 'Default', value: {
      ...defaultVoice
    }
  },
])
</script>
