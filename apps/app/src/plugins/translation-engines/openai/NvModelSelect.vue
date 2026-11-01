<template>
  <NvSelect :options="options" v-bind="$attrs" />
</template>
<script lang="ts" setup>
import { NvSelect } from '@packages/ui'
import { models } from './shared'

const options = models.map((model) => ({ label: model, value: model }))
</script>
