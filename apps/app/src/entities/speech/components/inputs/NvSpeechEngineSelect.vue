<template>
  <NvSelect v-bind="$attrs">
    <template v-for="engine in speechEngines" :key="engine.id">
      <NvOption
        :disabled="engine.hasCredentials ? !engine.hasCredentials() : false"
        :label="engine.name"
        :title="engine.hasCredentials && !engine.hasCredentials() ? 'Requires credentials' : ''"
        :value="engine.id"
      >{{
          engine.name
        }}
      </NvOption>
    </template>
  </NvSelect>
</template>
<script lang="ts" setup>
import { NvOption, NvSelect } from '@/core/components'
import speechEngineManager from '@/entities/speech/modules/speech-engine-manager'

const speechEngines = speechEngineManager.getEngines()
</script>
