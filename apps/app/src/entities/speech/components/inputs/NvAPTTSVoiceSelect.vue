<template>
  <NvSelect v-loading="isFetching" v-bind="$attrs" valueKey="Id">
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
import { useAPTTSListVoicesQuery } from '@/entities/speech/services'
import { purify } from '@/utils/object'
import { orderBy } from 'lodash'

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
const { data, isFetching } = useAPTTSListVoicesQuery(computedParams, {
  enabled: canFetch,
})
const voices = computed(() => orderBy(data.value || [], ['LanguageCode', 'Name']))
watch([computedIdentityPoolId, computedRegion], () =>
  canFetch.value && queryClient.refetchQueries('aptts-list-voices'),
)
</script>
