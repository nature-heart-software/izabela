<template>
  <NvSelect
    ref="select"
    :autocompleteWidth="width"
    :options="options"
    v-bind="{
      modelValue: settingsStore.textInputLanguage,
      'onUpdate:modelValue': (value) =>
        settingsStore.$patch({ textInputLanguage: value }),
      ...$attrs,
    }"
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
