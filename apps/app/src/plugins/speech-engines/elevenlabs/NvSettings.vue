<template>
  <NvAccessBlocker :allowed="!!getProperty('apiKey', true)" reason="Credentials required">
    <NvStack spacing="5">
      <NvFormItem label="Voice">
        <NvVoiceSelect/>
      </NvFormItem>
      <NvDivider direction="horizontal"/>
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
      <NvDivider direction="horizontal"/>
      <NvFormItem label="Similarity">
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
      <NvDivider direction="horizontal" />
      <NvFormItem label="Style Exaggeration">
        <NvGroup>
          <NvRangeInput
            :max="1"
            :min="0"
            :step="0.01"
            class="!grow"
            v-bind="{
              modelValue: getProperty('style'),
              'onUpdate:modelValue': (value) => setProperty('style', value),
            }"
          />
          <NvNumberInput
            :max="1"
            :min="0"
            :step="0.01"
            v-bind="{
              modelValue: getProperty('style'),
              'onUpdate:modelValue': (value) => setProperty('style', value),
            }"
          />
        </NvGroup>
      </NvFormItem>
      <NvDivider direction="horizontal" />
      <NvGroup justify="apart" no-wrap spacing="5">
        <NvStack>
          <NvText type="label">Speaker Boost</NvText>
        </NvStack>
        <NvSwitch
          :modelValue="getProperty('use_speaker_boost')"
          @update:modelValue="(value) => setProperty('use_speaker_boost', value)"
        />
      </NvGroup>
    </NvStack>
  </NvAccessBlocker>
  <NvDivider direction="horizontal"/>
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
  NvStack, NvSwitch, NvText,
} from '@packages/ui'
import NvVoiceSelect from './NvVoiceSelect'
import { getProperty, setProperty } from './store'</script>
