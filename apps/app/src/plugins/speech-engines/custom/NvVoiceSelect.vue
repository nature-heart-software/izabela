<template>
  <NvSelect
    v-loading="isFetching"
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
import { computed, watch } from 'vue'
import { useQueryClient } from 'vue-query'
import { NvSelect } from '@packages/ui'
import { purify } from '@packages/toolbox'
import { groupOptions } from '@/utils/select'
import { useListVoicesQuery } from './hooks'
import { getVoiceName, LIST_VOICES_QUERY_KEY } from './shared'
import { getProperty, setProperty } from './store'

const queryClient = useQueryClient()
const computedParams = computed(() => ({
  endpoint: getProperty('endpoint'),
  credentials: {
    apiKey: getProperty('apiKey', true),
  },
}))
const canFetch = computed(() => [computedParams.value.endpoint].every(Boolean))
const { data, isFetching } = useListVoicesQuery(computedParams, {
  enabled: canFetch,
})
const voices = computed(() => data.value || [])
const options = computed(() => [
  ...groupOptions(voices.value.map((voice: any) => ({
    label: getVoiceName(voice),
    value: voice,
    category: voice.category,
  })), 'category'),
])
watch(
  () => [canFetch.value, computedParams.value.credentials, computedParams.value.endpoint],
  () => canFetch.value && queryClient.refetchQueries(LIST_VOICES_QUERY_KEY),
  {
    deep: true,
  },
)
</script>
