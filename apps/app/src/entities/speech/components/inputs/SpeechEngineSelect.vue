<template>
  <NvSelect v-bind="$attrs">
    <template v-for="engine in SPEECH_ENGINES" :key="engine.id">
      <NvOption :label="engine.name" :value="engine.id">{{ engine.name }}</NvOption>
    </template>
  </NvSelect>
</template>
<script lang="ts">
import { defineComponent } from 'vue'
import { NvOption, NvSelect } from '@/core/components'
import { SPEECH_ENGINES } from '@/entities/speech'

export default defineComponent({
  name: 'SpeechEngineSelect',
  components: {
    NvSelect,
    NvOption,
  },
  setup() {
    return {
      SPEECH_ENGINES,
    }
  },
})
</script>
