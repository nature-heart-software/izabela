<template>
  <NvVirtualizedSelect
    v-loading="isFetching"
    :autocompleteWidth="300"
    :modelValue="getProperty('selectedVoice')"
    :options="options"
    v-bind="$attrs"
    @update:modelValue="(value) => setProperty('selectedVoice', value)"
  />
</template>
<script lang="ts" setup>
import { computed } from 'vue'
import { NvVirtualizedSelect } from '@packages/ui'
import { sortBy } from 'lodash'
import { useListVoicesQuery } from './hooks'
import { getProperty, setProperty } from './store'

const { data, isFetching } = useListVoicesQuery()
const voices = computed(() => sortBy(data.value || []))
const options = computed(() => [
  { label: 'Default', value: null },
  ...voices.value.map((voice) => ({
    label: voice,
    value: voice,
  })),
])
</script>
