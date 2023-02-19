<template>
  <NvNumberInput
    :modelValue="settingsStore.soxDevice"
    @update:modelValue="(value) => settingsStore.$patch({ soxDevice: value })"
  />
</template>
<script lang="ts" setup>
import { NvNumberInput } from '@packages/ui'
import { useSettingsStore } from '@/features/settings/store'

const settingsStore = useSettingsStore()
</script>
