<template>
  <NvSelect
    v-loading="isFetching"
    :modelValue="store.getters['settings/persisted'].GCTTSSelectedVoice"
    v-bind="$attrs"
    valueKey="name"
    @update:modelValue="
      (value) =>
        store.dispatch('settings/setProperty', ['persisted.GCTTSSelectedVoice', value])
    "
  >
    <template v-for="voice in voices" :key="voice.name">
      <NvOption :label="`${voice.name} - ${voice.ssmlGender}`" :value="purify(voice)">
        {{ `${voice.name} - ${voice.ssmlGender}` }}
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
import { useGCTTSListVoicesQuery } from '@/entities/speech/services'
import { purify } from '@/utils/object'

const queryClient = useQueryClient()
const store = useStore()
const computedApikey = computed(() => decrypt(store.getters['settings/persisted'].GCTTSApiKey))
const computedParams = computed(() => ({
  credentials: {
    apiKey: computedApikey.value,
  },
}))
const canFetch = computed(() => Object.values(computedParams.value.credentials).every(Boolean))
const { data, isFetching } = useGCTTSListVoicesQuery(computedParams, {
  enabled: canFetch,
})
const voices = computed(() => data.value || [])
watch(computedApikey, () => canFetch.value && queryClient.refetchQueries('gctts-list-voices'))
</script>
