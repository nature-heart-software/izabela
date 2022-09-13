<template>
  <NvSelect
    v-loading="isFetching"
    :modelValue="getProperty('selectedVoice')"
    v-bind="$attrs"
    valueKey="name"
    @update:modelValue="(value) => setProperty('selectedVoice', value)"
  >
    <template v-for="voice in voices" :key="voice.name">
      <NvOption :label="`${voice.name} - ${voice.gender}`" :value="purify(voice)">
        {{ `${voice.name} - ${voice.gender}` }}
      </NvOption>
    </template>
  </NvSelect>
</template>
<script lang="ts" setup>
import { computed, watch } from 'vue'
import { useQueryClient } from 'vue-query'
import { NvOption, NvSelect } from '@packages/ui'
import { orderBy } from 'lodash'
import { useListVoicesQuery } from './hooks'
import { LIST_VOICES_QUERY_KEY } from './consts'
import { getProperty, setProperty } from './store'
import { purify } from '@packages/toolbox'

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
watch(
  () => [getProperty('apiKey', true), getProperty('url')],
  () => canFetch.value && queryClient.refetchQueries(LIST_VOICES_QUERY_KEY),
)
</script>
