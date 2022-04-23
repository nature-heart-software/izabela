<template>
  <NvSelect v-bind="$attrs">
    <template v-for="voice in voices" :key="voice.name">
      <NvOption :label="`${voice.name} - ${voice.ssmlGender}`" :value="voice.name">
        {{ `${voice.name} - ${voice.ssmlGender}` }}
      </NvOption>
    </template>
  </NvSelect>
</template>
<script lang="ts">
import { defineComponent, computed, watch } from 'vue'
import { useStore } from 'vuex'
import { NvSelect, NvOption } from '@/core/components'
import { decrypt } from '@/utils/security'
import { useGCTTSListVoicesQuery } from '@/entities/speech/services'
import { useQueryClient } from 'vue-query'

export default defineComponent({
  name: 'SpeechEngineSelect',
  components: {
    NvSelect,
    NvOption,
  },
  setup() {
    const queryClient = useQueryClient()
    const store = useStore()
    const computedApikey = computed(() => decrypt(store.getters['settings/persisted'].GCTTSApiKey))
    const { data } = useGCTTSListVoicesQuery({ apiKey: computedApikey.value })
    const voices = computed(() => data.value || [])
    const refetchVoices = () => {
      queryClient.refetchQueries('gctts-list-voices')
    }
    watch(computedApikey, refetchVoices)
    return {
      voices,
    }
  },
})
</script>
