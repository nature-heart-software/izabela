<template>
  <NvSelect
    :options="options"
    v-bind="{
      modelValue: store.getProperty('model'),
      'onUpdate:modelValue': (value) => store.setProperty('model', value),
      ...$attrs,
    }"
  />
</template>
<script lang="ts" setup>
import { NvSelect } from '@packages/ui'
import { store } from './store'
import { models } from './shared'

const options = models.map((model) => ({ label: model, value: model }))
</script>
