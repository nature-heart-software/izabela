<template>
  <NvSelect :options="options" v-bind="$attrs"/>
</template>
<script lang="ts" setup>
import { NvSelect } from '@packages/ui'
import { computed } from 'vue'
import { useSpeechEngineManager } from '@/modules/speech-engine-manager'
import { orderBy } from 'lodash'

const { engines } = useSpeechEngineManager()
const options = computed(() =>
  orderBy(engines.value.map((engine) => {
    const disabled = engine.hasCredentials ? !engine.hasCredentials() : false
    return {
      disabled,
      label: engine.name,
      value: engine.id,
      attrs: {
        title: disabled ? 'Requires credentials' : '',
      },
    }
  }), ['disabled', 'label'], ['asc', 'asc']),
)
</script>
