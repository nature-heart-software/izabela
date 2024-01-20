<template>
  <NvSelect
    ref="select"
    :autocompleteWidth="width"
    :modelValue="settingsStore.messageMode"
    :options="options"
    @update:modelValue="(value) => settingsStore.$patch({ messageMode: value })"
  />
</template>
<script lang="ts" setup>
import { NvSelect } from '@packages/ui'
import { useElementSize } from '@vueuse/core'
import { computed, ref } from 'vue'
import { useSettingsStore } from '@/features/settings/store'

const settingsStore = useSettingsStore()

const options = computed(() => [
  {
    label: 'Sentence',
    value: 'sentence',
  },
  {
    label: 'Word',
    value: 'word',
  },
])
const select = ref()
const { width } = useElementSize(select)
</script>
