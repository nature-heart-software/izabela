<template>
  <NvFormItem label="Voice">
    <NvVoiceSelect/>
  </NvFormItem>
  <NvDivider direction="horizontal"/>
  <NvAccessBlocker
    :allowed="getProperty('selectedVoice').name === 'Custom'"
    reason='Only available for the "Custom" voice'
  >
    <NvStack spacing="5">
      <NvFormItem label="Pitch">
        <NvGroup>
          <NvRangeInput
            :max="255"
            :min="0"
            class="!grow"
            v-bind="{
            modelValue: getProperty('speech'),
            'onUpdate:modelValue': (value) => setProperty('speech', value),
          }"
          />
          <NvNumberInput
            :max="255"
            :min="0"
            v-bind="{
            modelValue: getProperty('speech'),
            'onUpdate:modelValue': (value) => setProperty('speech', value),
          }"
          />
        </NvGroup>
      </NvFormItem>
      <NvDivider direction="horizontal"/>
      <NvFormItem label="Speed">
        <NvGroup>
          <NvRangeInput
            :max="255"
            :min="0"
            class="!grow"
            v-bind="{
            modelValue: getProperty('speed'),
            'onUpdate:modelValue': (value) => setProperty('speed', value),
          }"
          />
          <NvNumberInput
            :max="255"
            :min="0"
            v-bind="{
            modelValue: getProperty('speed'),
            'onUpdate:modelValue': (value) => setProperty('speed', value),
          }"
          />
        </NvGroup>
      </NvFormItem>
      <NvDivider direction="horizontal"/>
      <NvFormItem label="Mouth">
        <NvGroup>
          <NvRangeInput
            :max="255"
            :min="0"
            class="!grow"
            v-bind="{
            modelValue: getProperty('mouth'),
            'onUpdate:modelValue': (value) => setProperty('mouth', value),
          }"
          />
          <NvNumberInput
            v-bind="{
            modelValue: getProperty('mouth'),
            'onUpdate:modelValue': (value) => setProperty('mouth', value),
          }"
          />
        </NvGroup>
      </NvFormItem>
      <NvDivider direction="horizontal"/>
      <NvFormItem label="Throat">
        <NvGroup>
          <NvRangeInput
            :max="255"
            :min="0"
            class="!grow"
            v-bind="{
            modelValue: getProperty('throat'),
            'onUpdate:modelValue': (value) => setProperty('throat', value),
          }"
          />
          <NvNumberInput
            v-bind="{
            modelValue: getProperty('throat'),
            'onUpdate:modelValue': (value) => setProperty('throat', value),
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
  NvNumberInput,
  NvRangeInput,
  NvStack,
} from '@packages/ui'
import NvVoiceSelect from './NvVoiceSelect'
import { getProperty, setProperty } from './store'</script>
