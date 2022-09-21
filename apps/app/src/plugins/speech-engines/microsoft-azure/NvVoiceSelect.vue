<template>
  <NvVirtualizedSelect
    v-loading="isFetching"
    :modelValue="getProperty('selectedVoice')"
    :options="options"
    v-bind="$attrs"
    valueKey="Name"
    @update:modelValue="(value) => setProperty('selectedVoice', purify(value))"
  >
    <!--    <template v-for="voice in voices" :key="voice.Name">-->
    <!--      <NvOption-->
    <!--        :label="`${voice.Locale} ${voice.DisplayName} - ${voice.Gender}`"-->
    <!--        :value="purify(voice)"-->
    <!--      >-->
    <!--        {{ `${voice.Locale} ${voice.DisplayName} - ${voice.Gender}` }}-->
    <!--      </NvOption>-->
    <!--    </template>-->
  </NvVirtualizedSelect>
</template>
<script lang="ts" setup>
import { computed, watch } from 'vue'
import { useQueryClient } from 'vue-query'
import { NvVirtualizedSelect } from '@packages/ui'
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
const options = computed(() =>
  voices.value.map((voice) => ({
    label: `${voice.Locale} ${voice.DisplayName} - ${voice.Gender}`,
    value: voice,
  })),
)
watch(
  () => [getProperty('apiKey', true), getProperty('region')],
  () => canFetch.value && queryClient.refetchQueries(LIST_VOICES_QUERY_KEY),
)
</script>
