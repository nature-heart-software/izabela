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
import { defineComponent, ref, computed, watch } from 'vue'
import { useStore } from 'vuex'
import axios from 'axios'
import { NvOption, NvSelect } from '@/core/components'
import { decrypt } from '@/utils/security'

export default defineComponent({
  name: 'SpeechEngineSelect',
  components: {
    NvSelect,
    NvOption,
  },
  setup() {
    const store = useStore()
    const resData = ref([])
    const voices = computed(() => resData.value)
    const computedApikey = computed(() => decrypt(store.getters['settings/persisted'].GCTTSApiKey))
    const fetchVoices = () => {
      axios
        .post('http://localhost:7070/api/tts/google-cloud/list-voices', {
          apiKey: computedApikey.value,
        })
        .then(({ data }) => {
          resData.value = data
        })
    }
    if (computedApikey.value) {
      fetchVoices()
    }
    watch(computedApikey, fetchVoices)
    return {
      voices,
    }
  },
})
</script>
