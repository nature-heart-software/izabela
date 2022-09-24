<template>
  <NvSelect
    v-loading="isFetching"
    :modelValue="getProperty('selectedVoice')"
    :options="options"
    v-bind="$attrs"
    valueKey="Id"
    @update:modelValue="(value) => setProperty('selectedVoice', purify(value))"
  />
</template>
<script lang="ts" setup>
import { computed, watch } from 'vue'
import { useQueryClient } from 'vue-query'
import { purify } from '@packages/toolbox'
import { orderBy } from 'lodash'
import { NvSelect } from '@packages/ui'
import { useListVoicesQuery } from './hooks'
import { LIST_VOICES_QUERY_KEY } from './consts'
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
    label: `${voice.LanguageCode} ${voice.Name} - ${voice.Gender}`,
    value: voice,
  })),
)
watch(
  () => [getProperty('identityPoolId', true), getProperty('region')],
  () => canFetch.value && queryClient.refetchQueries(LIST_VOICES_QUERY_KEY),
)
</script>
