<template>
  <NvFormItem label="Identity Pool ID">
    <NvInput
      :modelValue="store.getProperty('identityPoolId', true)"
      show-password
      type="password"
      @update:modelValue="
        (value) => store.setProperty('identityPoolId', value, true)
      "
    />
  </NvFormItem>
  <NvDivider direction="horizontal" />
  <NvFormItem label="Region">
    <NvInput
      :modelValue="store.getProperty('region')"
      @update:modelValue="(value) => store.setProperty('region', value)"
    />
  </NvFormItem>
</template>
<script lang="ts" setup>
import { NvDivider, NvFormItem, NvInput } from '@packages/ui'
import { store } from './store'
</script>
