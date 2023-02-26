<template>
  <NvSelect
    ref="select"
    :autocompleteWidth="width"
    :modelValue="settingsStore.textTranslationStrategy"
    :options="[
      {
        label: 'Cloud Translation',
        value: 'cloud-translation',
      },
      {
        label: 'Custom',
        value: 'custom',
      },
    ]"
    class="shrink-0"
    @update:modelValue="(value) => settingsStore.$patch({ textTranslationStrategy: value })"
  />
</template>
<script lang="ts" setup>
import { NvSelect } from '@packages/ui'
import { useElementSize } from '@vueuse/core'
import { ref } from 'vue'
import { useSettingsStore } from '@/features/settings/store'

const settingsStore = useSettingsStore()
const select = ref()
const { width } = useElementSize(select)
</script>
