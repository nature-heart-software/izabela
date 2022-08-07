<template>
  <NvSelect
    v-loading="isFetching"
    :modelValue="store.getters['settings/persisted'].APTTSSelectedVoice"
    v-bind="$attrs"
    valueKey="Id"
    @update:modelValue="
      (value) =>
        store.dispatch('settings/setProperty', ['persisted.APTTSSelectedVoice', value])
    "
  >
    <template v-for="voice in voices" :key="voice.Id">
      <NvOption
        :label="`${voice.LanguageCode} ${voice.Name} - ${voice.Gender}`"
        :value="purify(voice)"
      >
        {{ `${voice.LanguageCode} ${voice.Name} - ${voice.Gender}` }}
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
const computedIdentityPoolId = computed(() =>
  decrypt(store.getters['settings/persisted'].APTTSIdentityPoolId),
)
const computedRegion = computed(() => store.getters['settings/persisted'].APTTSRegion)

const computedParams = computed(() => ({
  credentials: {
    identityPoolId: computedIdentityPoolId.value,
    region: computedRegion.value,
  },
}))
const canFetch = computed(() => Object.values(computedParams.value.credentials).every(Boolean))
const { data, isFetching } = useListVoicesQuery(computedParams, {
  enabled: canFetch,
})
const voices = computed(() => orderBy(data.value || [], ['LanguageCode', 'Name']))
watch([computedIdentityPoolId, computedRegion], () =>
  canFetch.value && queryClient.refetchQueries(listVoicesQueryKey),
)
</script>
