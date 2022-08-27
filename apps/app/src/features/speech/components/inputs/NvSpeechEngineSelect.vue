<template>
  <NvSelect v-bind="$attrs">
    <template v-for="engine in engines" :key="engine.id">
      <NvOption
        :disabled="engine.hasCredentials ? !engine.hasCredentials() : false"
        :label="engine.name"
        :title="engine.hasCredentials && !engine.hasCredentials() ? 'Requires credentials' : ''"
        :value="engine.id"
        >{{ engine.name }}
      </NvOption>
    </template>
  </NvSelect>
</template>
<script lang="ts" setup>
import { NvOption, NvSelect } from '@packages/ui'
import { useSpeechEngineManager } from '@/modules/speech-engine-manager'

const { engines } = useSpeechEngineManager()
</script>
