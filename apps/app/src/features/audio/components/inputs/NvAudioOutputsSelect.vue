<template>
  <NvVirtualizedSelect
    :modelValue="settingsStore.audioOutputs"
    :options="options"
    multiple
    @update:modelValue="(value) => settingsStore.$patch({ audioOutputs: value })"
  />
</template>
<script lang="ts" setup>
import { computed } from 'vue'
import { NvVirtualizedSelect } from '@packages/ui'
import { useDevicesList } from '@vueuse/core'
import { useSettingsStore } from '@/features/settings/store'

const settingsStore = useSettingsStore()

const { audioOutputs } = useDevicesList()

const options = computed(() =>
  audioOutputs.value.map((output) => ({
    label: output.label,
    value: output.label,
  })),
)
</script>
