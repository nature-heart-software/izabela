<template>
  <NvVirtualizedSelect :options="options" v-bind="$attrs">
    <!--    <template v-for="engine in engines" :key="engine.id">-->
    <!--      <NvOption-->
    <!--        :disabled="engine.hasCredentials ? !engine.hasCredentials() : false"-->
    <!--        :label="engine.name"-->
    <!--        :title="engine.hasCredentials && !engine.hasCredentials() ? 'Requires credentials' : ''"-->
    <!--        :value="engine.id"-->
    <!--        >{{ engine.name }}-->
    <!--      </NvOption>-->
    <!--    </template>-->
  </NvVirtualizedSelect>
</template>
<script lang="ts" setup>
import { NvVirtualizedSelect } from '@packages/ui'
import { useSpeechEngineManager } from '@/modules/speech-engine-manager'
import { computed } from 'vue'

const { engines } = useSpeechEngineManager()
const options = computed(() =>
  engines.value.map((engine) => {
    const disabled = engine.hasCredentials ? !engine.hasCredentials() : false
    return {
      disabled,
      label: engine.name,
      value: engine.id,
      attrs: {
        title: disabled ? 'Requires credentials' : '',
      },
    }
  }),
)
</script>
