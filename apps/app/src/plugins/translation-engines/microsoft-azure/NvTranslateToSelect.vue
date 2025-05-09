<template>
  <NvSelect
    ref="select"
    :autocompleteWidth="width"
    :options="options"
    v-bind="$attrs"
  />
</template>
<script lang="ts" setup>
import { NvSelect } from '@packages/ui'
import { useElementSize } from '@vueuse/core'
import { ref } from 'vue'
// eslint-disable-next-line camelcase
import { getAll639_1, getName } from 'all-iso-language-codes'

const select = ref()
const { width } = useElementSize(select)
const isoCodes = getAll639_1()
const options = [
  {
    label: 'Auto',
    value: null,
  },
  ...isoCodes.map((code) => ({ label: getName(code, 'en'), value: code })),
]
</script>
