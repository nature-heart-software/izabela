<template>
  <NvAccessBlocker :allowed="!!getProperty('apiKey', true)" reason="Credentials required">
    <NvFormItem label="Voice">
      <NvVoiceSelect />
    </NvFormItem>
  </NvAccessBlocker>
  <NvDivider direction="horizontal" />
  <NvStack spacing="5">
    <NvFormItem label="API Key">
      <NvInput
        :modelValue="getProperty('apiKey', true)"
        show-password
        type="password"
        @update:modelValue="(value) => setProperty('apiKey', value, true)"
      />
    </NvFormItem>
  </NvStack>
  <NvDivider direction="horizontal" />
  <NvAccessBlocker :allowed="!!getProperty('apiKey', true)" reason="Credentials required">
    <NvStack spacing="5">
      <NvFormItem label="Stability">
        <NvGroup>
          <NvRangeInput
            :max="1"
            :min="0"
            :step="0.01"
            class="!grow"
            v-bind="{
              modelValue: getProperty('stability'),
              'onUpdate:modelValue': (value) => setProperty('stability', value),
            }"
          />
          <NvNumberInput
            :max="1"
            :min="0"
            :step="0.01"
            v-bind="{
              modelValue: getProperty('stability'),
              'onUpdate:modelValue': (value) => setProperty('stability', value),
            }"
          />
        </NvGroup>
      </NvFormItem>
      <NvDivider direction="horizontal" />
      <NvFormItem label="Clarity + Similarity Enhancement">
        <NvGroup>
          <NvRangeInput
            :max="1"
            :min="0"
            :step="0.01"
            class="!grow"
            v-bind="{
              modelValue: getProperty('similarity_boost'),
              'onUpdate:modelValue': (value) => setProperty('similarity_boost', value),
            }"
          />
          <NvNumberInput
            :max="1"
            :min="0"
            :step="0.01"
            v-bind="{
              modelValue: getProperty('similarity_boost'),
              'onUpdate:modelValue': (value) => setProperty('similarity_boost', value),
            }"
          />
        </NvGroup>
      </NvFormItem>
    </NvStack>
  </NvAccessBlocker>
</template>
<script lang="ts" setup>
import {
  NvAccessBlocker,
  NvDivider,
  NvFormItem,
  NvGroup,
  NvInput,
  NvNumberInput,
  NvRangeInput,
  NvStack,
} from '@packages/ui'
import { useSpeechStore } from '@/features/speech/store'
import NvVoiceSelect from './NvVoiceSelect'
import { getProperty, setProperty } from './store'

const speechStore = useSpeechStore()
</script>
