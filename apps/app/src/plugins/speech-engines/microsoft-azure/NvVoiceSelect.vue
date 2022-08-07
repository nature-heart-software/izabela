<template>
  <NvSelect
    v-loading="isFetching"
    :modelValue="store.getters['settings/persisted'].MATTSSelectedVoice"
    v-bind="$attrs"
    valueKey="Name"
    @update:modelValue="
      (value) => store.dispatch('settings/setProperty', ['persisted.MATTSSelectedVoice', value])
    "
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
import { useStore } from 'vuex'
import { useQueryClient } from 'vue-query'
import { NvOption, NvSelect } from '@/core/components'
import { decrypt } from '@/utils/security'
import { purify } from '@/utils/object'
import { orderBy } from 'lodash'
import { listVoicesQueryKey, useListVoicesQuery } from './hooks'

const queryClient = useQueryClient()
const store = useStore()
const computedApikey = computed(() => decrypt(store.getters['settings/persisted'].MATTSApiKey))
const computedRegion = computed(() => store.getters['settings/persisted'].MATTSRegion)

const computedParams = computed(() => ({
  credentials: {
    apiKey: computedApikey.value,
    region: computedRegion.value,
  },
}))
const canFetch = computed(() => Object.values(computedParams.value.credentials).every(Boolean))
const { data, isFetching } = useListVoicesQuery(computedParams, {
  enabled: canFetch,
})
const voices = computed(() => orderBy(data.value || [], ['Locale', 'DisplayName']))
watch(
  [computedApikey, computedRegion],
  () => canFetch.value && queryClient.refetchQueries(listVoicesQueryKey),
)
</script>
