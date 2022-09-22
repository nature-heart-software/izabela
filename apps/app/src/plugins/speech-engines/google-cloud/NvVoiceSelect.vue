<template>
  <NvVirtualizedSelect
    v-loading="isFetching"
    :autocompleteWidth="300"
    :modelValue="getProperty('selectedVoice')"
    :options="options"
    v-bind="$attrs"
    valueKey="name"
    @update:modelValue="(value) => setProperty('selectedVoice', purify(value))"
  >
    <!--    <template v-for="voice in voices" :key="voice.name">-->
    <!--      <NvOption :label="`${voice.name} - ${voice.ssmlGender}`" :value="purify(voice)">-->
    <!--        {{ `${voice.name} - ${voice.ssmlGender}` }}-->
    <!--      </NvOption>-->
    <!--    </template>-->
  </NvVirtualizedSelect>
</template>
<script lang="ts" setup>
import { computed, watch } from 'vue'
import { useQueryClient } from 'vue-query'
import { NvVirtualizedSelect } from '@packages/ui'
import { purify } from '@packages/toolbox'
import { useListVoicesQuery } from './hooks'
import { LIST_VOICES_QUERY_KEY } from './consts'
import { getProperty, setProperty } from './store'

const queryClient = useQueryClient()
const computedParams = computed(() => ({
  credentials: {
    apiKey: getProperty('apiKey', true),
  },
}))
const canFetch = computed(() => Object.values(computedParams.value.credentials).every(Boolean))
const { data, isFetching } = useListVoicesQuery(computedParams, {
  enabled: canFetch,
})
const voices = computed(() => data.value || [])
const options = computed(() =>
  voices.value.map((voice: any) => ({
    label: `${voice.name} - ${voice.ssmlGender}`,
    value: voice,
  })),
)
watch(
  () => getProperty('apiKey', true),
  () => canFetch.value && queryClient.refetchQueries(LIST_VOICES_QUERY_KEY),
)
</script>
