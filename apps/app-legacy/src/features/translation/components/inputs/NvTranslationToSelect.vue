<template>
  <NvSelect
    ref="select"
    :autocompleteWidth="width"
    :modelValue="settingsStore.textOutputLanguage"
    :options="options"
    @update:modelValue="(value) => settingsStore.$patch({ textOutputLanguage: value })"
  />
</template>
<script lang="ts" setup>
import { NvSelect } from '@packages/ui'
import { useElementSize } from '@vueuse/core'
import { ref } from 'vue'
import { useSettingsStore } from '@/features/settings/store'
// eslint-disable-next-line camelcase
import { getAll639_1, getName } from 'all-iso-language-codes'

const settingsStore = useSettingsStore()
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
