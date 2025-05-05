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
</template>
<script lang="ts" setup>
import { NvFormItem, NvInput } from '@packages/ui'
import { store } from './store'
</script>
