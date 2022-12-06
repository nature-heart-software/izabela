<template>
  <NvSelect
    v-loading="isFetching"
    :options="options"
    v-bind="{
      modelValue: getProperty('selectedVoice'),
      'onUpdate:modelValue': (value) => setProperty('selectedVoice', purify(value)),
      ...$attrs,
    }"
    valueKey="Id"
  />
</template>
<script lang="ts" setup>
import { computed, watch } from 'vue'
import { useQueryClient } from 'vue-query'
import { purify } from '@packages/toolbox'
import { orderBy } from 'lodash'
import { NvSelect } from '@packages/ui'
import { useListVoicesQuery } from './hooks'
import { getVoiceName, LIST_VOICES_QUERY_KEY } from './shared'
import { getProperty, setProperty } from './store'

const queryClient = useQueryClient()

const computedParams = computed(() => ({
  credentials: {
    identityPoolId: getProperty('identityPoolId', true),
    region: getProperty('region'),
  },
}))
const canFetch = computed(() => Object.values(computedParams.value.credentials).every(Boolean))
const { data, isFetching } = useListVoicesQuery(computedParams, {
  enabled: canFetch,
})
const voices = computed(() => orderBy(data.value || [], ['LanguageCode', 'Name']))
const options = computed(() =>
  voices.value.map((voice) => ({
    label: getVoiceName(voice),
    value: voice,
  })),
)
watch(
  () => [getProperty('identityPoolId', true), getProperty('region')],
  () => canFetch.value && queryClient.refetchQueries(LIST_VOICES_QUERY_KEY),
)
</script>
