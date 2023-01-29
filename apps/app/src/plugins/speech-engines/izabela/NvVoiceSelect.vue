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
import { useSpeechStore } from '@/features/speech/store'
import { useListVoicesQuery } from './hooks'
import { getVoiceName, LIST_VOICES_QUERY_KEY } from './shared'
import { getProperty, setProperty } from './store'

const queryClient = useQueryClient()
const computedParams = computed(() => ({
  credentials: {},
}))
const speechStore = useSpeechStore()
const canFetch = computed(() => speechStore.hasUniversalApiCredentials)
const { data, isFetching } = useListVoicesQuery(computedParams, {
  enabled: canFetch,
})
const voices = computed(() => data.value || [])
const options = computed(() => [
  {
    label: 'Default',
    value: null,
  },
  ...voices.value.map((voice: any) => ({
    label: getVoiceName(voice),
    value: voice,
  })),
])
watch(
  () => canFetch.value,
  () => canFetch.value && queryClient.refetchQueries(LIST_VOICES_QUERY_KEY),
)
</script>
