<template>
  <NvSelect v-bind="$attrs" valueKey="Name">
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
import { useMATTSListVoicesQuery } from '@/entities/speech/services'
import { purify } from '@/utils/object'
import { orderBy } from 'lodash'

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
const { data } = useMATTSListVoicesQuery(computedParams)
const voices = computed(() => orderBy(data.value || [], 'name'))
watch([computedApikey, computedRegion], () => queryClient.refetchQueries('matts-list-voices'))
</script>
