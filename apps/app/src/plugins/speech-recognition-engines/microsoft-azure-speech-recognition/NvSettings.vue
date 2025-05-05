<template>
  <NvFormItem label="API Key">
    <NvInput
      :modelValue="
                        store.getProperty(
                          'apiKey',
                          true,
                        )
                      "
      show-password
      type="password"
      @update:modelValue="
                        (value) =>
                          store.setProperty(
                            'apiKey',
                            value,
                            true,
                          )
                      "
    />
  </NvFormItem>
  <NvDivider direction="horizontal" />
  <NvFormItem label="Region">
    <NvInput
      :modelValue="
                        store.getProperty(
                          'region',
                        )
                      "
      @update:modelValue="
                        (value) =>
                          store.setProperty(
                            'region',
                            value,
                          )
                      "
    />
  </NvFormItem>
</template>
<script lang="ts" setup>
import { NvDivider, NvFormItem, NvInput } from '@packages/ui'
import { store } from './store'
</script>
