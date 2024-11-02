<template>
  <NvFormItem label="Voice">
    <NvVoiceSelect />
  </NvFormItem>
  <NvDivider direction="horizontal" />
  <NvFormItem label="Speed">
    <NvGroup>
      <NvRangeInput
        :max="300"
        :min="1"
        class="!grow"
        v-bind="{
          modelValue: getProperty('speed'),
          'onUpdate:modelValue': (value) => setProperty('speed', value),
        }"
      />
      <NvNumberInput
        :max="300"
        :min="1"
        v-bind="{
          modelValue: getProperty('speed'),
          'onUpdate:modelValue': (value) => setProperty('speed', value),
        }"
      />
    </NvGroup>
  </NvFormItem>
</template>
<script lang="ts" setup>
import {
  NvDivider,
  NvFormItem,
  NvGroup,
  NvNumberInput,
  NvRangeInput,
} from '@packages/ui'
import NvVoiceSelect from './NvVoiceSelect'
import { getProperty, setProperty } from '@/plugins/speech-engines/say/store.ts'
</script>
