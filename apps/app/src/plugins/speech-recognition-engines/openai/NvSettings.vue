<template>
  <NvFormItem label="Model">
    <NvModelSelect
      :modelValue="store.getProperty('model')"
      placeholder="Select a model"
      @update:modelValue="(value) => store.setProperty('model', value)"
    />
  </NvFormItem>
  <NvDivider direction="horizontal" />
  <NvFormItem label="Prompt">
    <NvTextarea
      placeholder="Example: The speaker may stutter or repeat syllables..."
      :modelValue="store.getProperty('prompt')"
      @update:modelValue="(value) => store.setProperty('prompt', value)"
    />
  </NvFormItem>
  <NvDivider direction="horizontal" />
  <NvFormItem label="API Key">
    <NvInput
      :modelValue="store.getProperty('apiKey', true)"
      show-password
      type="password"
      @update:modelValue="(value) => store.setProperty('apiKey', value, true)"
    />
  </NvFormItem>
</template>
<script lang="ts" setup>
import { NvDivider, NvFormItem, NvInput, NvTextarea } from '@packages/ui'
import { store } from './store'
import NvModelSelect from './NvModelSelect.vue'
</script>
