<template>
  <NvSelect
    ref="select"
    :autocompleteWidth="width"
    :modelValue="settingsStore.speechInputLanguage"
    :options="options"
    @update:modelValue="(value) => settingsStore.$patch({ speechInputLanguage: value })"
  />
</template>
<script lang="ts" setup>
import { NvSelect } from '@packages/ui'
import { useElementSize } from '@vueuse/core'
import { computed, ref } from 'vue'
import { useSettingsStore } from '@/features/settings/store'
import bcp47codes from '@/data/bcp-47-codes.json'

const settingsStore = useSettingsStore()
const select = ref()
const { width } = useElementSize(select)
const options = computed(() =>
  bcp47codes.map(({ languageCode, name }) => ({
    label: name,
    value: languageCode,
  })),
)
</script>
