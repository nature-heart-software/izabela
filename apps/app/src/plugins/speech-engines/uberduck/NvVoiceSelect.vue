<template>
  <NvSelect
    v-loading="isFetching"
    :options="options"
    v-bind="{
      modelValue: getProperty('selectedVoice'),
      'onUpdate:modelValue': (value) => setProperty('selectedVoice', purify(value)),
      ...$attrs,
    }"
    valueKey="voicemodel_uuid"
  />
</template>
<script lang="ts" setup>
import { computed, watch } from 'vue'
import { useQueryClient } from 'vue-query'
import { NvSelect } from '@packages/ui'
import { purify } from '@packages/toolbox'
import { orderBy } from 'lodash'
import { useSpeechStore } from '@/features/speech/store'
import { groupOptions } from '@/utils/select'
import { useListVoicesQuery } from './hooks'
import { getVoiceName, LIST_VOICES_QUERY_KEY } from './shared'
import { getProperty, setProperty } from './store'

const queryClient = useQueryClient()

const computedParams = computed(() => ({
  credentials: {
    apiKey: getProperty('publicKey', true),
    url: getProperty('privateKey', true),
  },
}))
const speechStore = useSpeechStore()
const canFetch = computed(
  () =>
    speechStore.hasUniversalApiCredentials ||
    Object.values(computedParams.value.credentials).every(Boolean),
)
const { data, isFetching } = useListVoicesQuery({
  enabled: canFetch,
})
const voices = computed(() => orderBy(data.value || [], 'display_name'))
const options = computed(() =>
  groupOptions(voices.value.map((voice) => ({
    label: getVoiceName(voice),
    value: voice,
    category: voice.category || 'Other',
  })), 'category'),
)
watch(
  () => [getProperty('publicKey', true), getProperty('privateKey', true)],
  () => canFetch.value && queryClient.refetchQueries(LIST_VOICES_QUERY_KEY),
)
</script>
