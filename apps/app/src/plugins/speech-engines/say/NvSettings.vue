<template>
  <NvFormItem label="Voice">
    <template v-if="engine">
      <component :is="engine.voiceSelectComponent"/>
    </template>
  </NvFormItem>
</template>
<script lang="ts" setup>
import { NvFormItem } from '@/core/components'
import { getEngineById } from '@/entities/speech/modules/speech-engine-manager'

const engine = getEngineById('saytts')
</script>
