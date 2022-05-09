<template>
  <NvSelect v-bind="$attrs" valueKey="name">
    <template v-for="voice in voices" :key="voice.name">
      <NvOption :label="`${voice.name} - ${voice.ssmlGender}`" :value="purify(voice)">
        {{ `${voice.name} - ${voice.ssmlGender}` }}
      </NvOption>
    </template>
  </NvSelect>
</template>
<script lang="ts">
import { computed, defineComponent, watch } from 'vue'
import { useStore } from 'vuex'
import { useQueryClient } from 'vue-query'
import { NvOption, NvSelect } from '@/core/components'
import { decrypt } from '@/utils/security'
import { useGCTTSListVoicesQuery } from '@/entities/speech/services'
import { purify } from '@/utils/object'

export default defineComponent({
  name: 'GCTTSVoiceSelect',
  components: {
    NvSelect,
    NvOption,
  },
  setup() {
    const queryClient = useQueryClient()
    const store = useStore()
    const computedApikey = computed(() => decrypt(store.getters['settings/persisted'].GCTTSApiKey))
    const computedParams = computed(() => ({
      credentials: {
        apiKey: computedApikey.value,
      },
    }))
    const { data } = useGCTTSListVoicesQuery(computedParams)
    const voices = computed(() => data.value || [])
    watch(computedApikey, () => queryClient.refetchQueries('gctts-list-voices'))
    return {
      voices,
      purify,
    }
  },
})
</script>
