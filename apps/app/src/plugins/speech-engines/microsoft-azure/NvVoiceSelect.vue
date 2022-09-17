<template>
  <NvSelect
    v-loading="isFetching"
    :modelValue="getProperty('selectedVoice')"
    v-bind="$attrs"
    valueKey="Name"
    @update:modelValue="(value) => setProperty('selectedVoice', value)"
  >
    <template v-for="voice in voices" :key="voice.Name">
      <NvOption
        :label="`${voice.Locale} ${voice.DisplayName} - ${voice.Gender}`"
        :value="purify(voice)"
      >
        {{ `${voice.Locale} ${voice.DisplayName} - ${voice.Gender}` }}
      </NvOption>
    </template>
  </NvSelect>
</template>
<script lang="ts" setup>
import { computed, watch } from 'vue'
import { useQueryClient } from 'vue-query'
import { NvOption, NvSelect } from '@packages/ui'
import { purify } from '@packages/toolbox'
import { orderBy } from 'lodash'
import { useListVoicesQuery } from './hooks'
import { LIST_VOICES_QUERY_KEY } from './consts'
import { getProperty, setProperty } from './store'

const queryClient = useQueryClient()

const computedParams = computed(() => ({
  credentials: {
    apiKey: getProperty('apiKey', true),
    region: getProperty('region'),
  },
}))
const canFetch = computed(() => Object.values(computedParams.value.credentials).every(Boolean))
const { data, isFetching } = useListVoicesQuery(computedParams, {
  enabled: canFetch,
})
const voices = computed(() => orderBy(data.value || [], ['Locale', 'DisplayName']))
watch(
  () => [getProperty('apiKey', true), getProperty('region')],
  () => canFetch.value && queryClient.refetchQueries(LIST_VOICES_QUERY_KEY),
)
</script>
