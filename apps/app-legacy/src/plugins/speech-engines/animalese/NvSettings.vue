<template>
  <NvFormItem label="Voice">
    <NvVoiceSelect />
  </NvFormItem>
  <NvDivider direction="horizontal" />
  <NvAccessBlocker
    :allowed="getProperty('selectedVoice').name === 'Custom'"
    reason='Only available for the "Custom" voice'
  >
    <NvStack spacing="5">
      <NvFormItem label="Pitch">
        <NvGroup>
          <NvRangeInput
            :max="2"
            :min="0.1"
            :step="0.1"
            class="!grow"
            v-bind="{
              modelValue: getProperty('pitch'),
              'onUpdate:modelValue': (value) => setProperty('pitch', value),
            }"
          />
          <NvNumberInput
            v-bind="{
              modelValue: getProperty('pitch'),
              'onUpdate:modelValue': (value) => setProperty('pitch', value),
            }"
          />
        </NvGroup>
      </NvFormItem>
      <NvDivider direction="horizontal" />
      <NvFormItem>
        <NvGroup justify="apart" no-wrap spacing="5">
          <NvStack>
            <NvText type="label">Shorten</NvText>
          </NvStack>
          <NvSwitch
            :modelValue="getProperty('shortened')"
            @update:modelValue="(value) => setProperty('shortened', value)"
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
  NvNumberInput,
  NvRangeInput,
  NvStack,
  NvSwitch,
  NvText,
} from '@packages/ui'
import NvVoiceSelect from './NvVoiceSelect'
import { getProperty, setProperty } from './store'
</script>
