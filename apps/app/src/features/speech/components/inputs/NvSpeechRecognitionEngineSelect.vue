<template>
  <NvSelect
    :modelValue="settingsStore.selectedSpeechRecognitionEngine"
    :options="options"
    v-bind="$attrs"
    @update:modelValue="
      (value) =>
        settingsStore.$patch({ selectedSpeechRecognitionEngine: value })
    "
  />
</template>
<script lang="ts" setup>
import { NvSelect } from '@packages/ui'
import { computed } from 'vue'
import orderBy from 'lodash/orderBy'
import { useSettingsStore } from '@/features/settings/store'

const options = computed(() =>
  orderBy(
    [
      { label: 'Google Cloud', value: 'google-cloud' },
      { label: 'Custom', value: 'custom' },
    ].map(({ label, value }) => {
      return {
        label,
        value,
      }
    }),
  ),
)

const settingsStore = useSettingsStore()
</script>
