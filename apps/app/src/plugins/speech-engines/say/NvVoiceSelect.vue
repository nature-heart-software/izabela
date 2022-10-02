<template>
  <NvSelect
    v-loading="isFetching"
    :modelValue="getProperty('selectedVoice')"
    :options="options"
    v-bind="$attrs"
    @update:modelValue="(value) => setProperty('selectedVoice', value)"
  />
</template>
<script lang="ts" setup>
import { computed } from 'vue'
import { NvSelect } from '@packages/ui'
import { sortBy } from 'lodash'
import { getVoiceName } from '@/plugins/speech-engines/say/shared'
import { useListVoicesQuery } from './hooks'
import { getProperty, setProperty } from './store'

const { data, isFetching } = useListVoicesQuery()
const voices = computed(() => sortBy(data.value || []))
const options = computed(() => [
  { label: 'Default', value: null },
  ...voices.value.map((voice) => ({
    label: getVoiceName(voice),
    value: voice,
  })),
])
</script>
