<template>
  <NvSelect
    v-loading="isFetching"
    :options="options"
    v-bind="{
      modelValue: getProperty('model'),
      'onUpdate:modelValue': (value) => setProperty('model', value),
      ...$attrs,
    }"
  />
</template>
<script lang="ts" setup>
import { computed, watch } from 'vue'
import { useQueryClient } from 'vue-query'
import { NvSelect } from '@packages/ui'
import { useListModelsQuery } from './hooks'
import { LIST_MODELS_QUERY_KEY, getModelName } from './shared'
import { getProperty, setProperty } from './store'
import { engine } from './register.ts'

const queryClient = useQueryClient()
const computedParams = computed(() => ({
  credentials: engine.getCredentials(),
}))
const canFetch = computed(() => engine.hasCredentials?.())
const { data, isFetching } = useListModelsQuery(computedParams, {
  enabled: canFetch,
})
const models = computed(() => data.value || [])
const options = computed(() =>
  models.value.map((model: string) => ({
    label: getModelName(model),
    value: model,
  })),
)
watch(
  () => getProperty('apiKey'),
  () => canFetch.value && queryClient.refetchQueries(LIST_MODELS_QUERY_KEY),
)
</script>