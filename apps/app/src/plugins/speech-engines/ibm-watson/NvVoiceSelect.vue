<template>
  <NvSelect
    v-loading="isFetching"
    :modelValue="getProperty('selectedVoice')"
    :options="options"
    v-bind="$attrs"
    valueKey="name"
    @update:modelValue="(value) => setProperty('selectedVoice', purify(value))"
  />
</template>
<script lang="ts" setup>
import { computed, watch } from 'vue'
import { useQueryClient } from 'vue-query'
import { NvSelect } from '@packages/ui'
import { purify } from '@packages/toolbox'
import { orderBy } from 'lodash'
import { useListVoicesQuery } from './hooks'
import { getVoiceName, LIST_VOICES_QUERY_KEY } from './shared'
import { getProperty, setProperty } from './store'

const queryClient = useQueryClient()

const computedParams = computed(() => ({
  credentials: {
    apiKey: getProperty('apiKey', true),
    url: getProperty('url'),
  },
}))
const canFetch = computed(() => Object.values(computedParams.value.credentials).every(Boolean))
const { data, isFetching } = useListVoicesQuery(computedParams, {
  enabled: canFetch,
})
const voices = computed(() => orderBy(data.value || [], 'name'))
const options = computed(() =>
  voices.value.map((voice) => ({
    label: getVoiceName(voice),
    value: voice,
  })),
)
watch(
  () => [getProperty('apiKey', true), getProperty('url')],
  () => canFetch.value && queryClient.refetchQueries(LIST_VOICES_QUERY_KEY),
)
</script>
