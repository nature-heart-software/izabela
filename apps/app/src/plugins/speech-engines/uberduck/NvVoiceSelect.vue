<template>
  <NvSelect
    v-loading="isFetching"
    :modelValue="getProperty('selectedVoice')"
    v-bind="$attrs"
    valueKey="voicemodel_uuid"
    @update:modelValue="(value) => setProperty('selectedVoice', value)"
  >
    <template v-for="voice in voices" :key="voice.name">
      <NvOption :label="`${voice.display_name}`" :value="purify(voice)">
        {{ `${voice.display_name}` }}
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
    apiKey: getProperty('publicKey', true),
    url: getProperty('privateKey', true),
  },
}))
const canFetch = computed(() => Object.values(computedParams.value.credentials).every(Boolean))
const { data, isFetching } = useListVoicesQuery({
  enabled: canFetch,
})
const voices = computed(() => orderBy(data.value || [], 'display_name'))
watch(
  () => [getProperty('publicKey', true), getProperty('privateKey', true)],
  () => canFetch.value && queryClient.refetchQueries(LIST_VOICES_QUERY_KEY),
)
</script>
