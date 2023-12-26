<template>
  <NvSelect
    v-loading="isFetching"
    :options="options"
    v-bind="{
      modelValue: getProperty('model_id'),
      'onUpdate:modelValue': (value) => setProperty('model_id', value),
      ...$attrs,
    }"
  />
</template>
<script lang="ts" setup>
import { computed, watch } from 'vue'
import { useQueryClient } from 'vue-query'
import { NvSelect } from '@packages/ui'
import { useListModelsQuery } from './hooks'
import { LIST_MODELS_QUERY_KEY } from './shared'
import { getProperty, setProperty } from './store'

const queryClient = useQueryClient()
const computedParams = computed(() => ({
  credentials: {
    apiKey: getProperty('apiKey', true),
  },
}))
const canFetch = computed(() => Object.values(computedParams.value.credentials).every(Boolean))
const { data, isFetching } = useListModelsQuery(computedParams, {
  enabled: canFetch,
})
const models = computed(() => data.value || [])
const options = computed(() =>
  models.value.map((model: any) => ({
    label: model.name,
    value: model.model_id,
  })),
)
watch(
  () => getProperty('apiKey', true),
  () => canFetch.value && queryClient.refetchQueries(LIST_MODELS_QUERY_KEY),
)
</script>
