<template>
  <NvSelect v-bind="$attrs" valueKey="name">
    <template v-for="voice in voices" :key="voice.name">
      <NvOption :label="`${voice.name} - ${voice.gender}`" :value="purify(voice)">
        {{ `${voice.name} - ${voice.gender}` }}
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
import { useIWTTSListVoicesQuery } from '@/entities/speech/services'
import { purify } from '@/utils/object'
import { orderBy } from 'lodash'

const queryClient = useQueryClient()
const store = useStore()
const computedApikey = computed(() => decrypt(store.getters['settings/persisted'].IWTTSApiKey))
const computedUrl = computed(() => store.getters['settings/persisted'].IWTTSUrl)

const computedParams = computed(() => ({
  credentials: {
    apiKey: computedApikey.value,
    url: computedUrl.value,
  },
}))
const { data } = useIWTTSListVoicesQuery(computedParams)
const voices = computed(() => orderBy(data.value || [], 'name'))
watch([computedApikey, computedUrl], () => queryClient.refetchQueries('iwtts-list-voices'))
</script>
