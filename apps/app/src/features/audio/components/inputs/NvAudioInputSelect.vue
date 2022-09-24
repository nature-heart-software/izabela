<template>
  <NvSelect
    :modelValue="settingsStore.audioInput"
    :options="options"
    @update:modelValue="(value) => settingsStore.$patch({ audioInput: value })"
  />
</template>
<script lang="ts" setup>
import { NvSelect } from '@packages/ui'
import { useDevicesList } from '@vueuse/core'
import { useSettingsStore } from '@/features/settings/store'
import { computed } from 'vue'

const settingsStore = useSettingsStore()

const { audioInputs } = useDevicesList()

const options = computed(() =>
  audioInputs.value.map((input) => ({
    label: input.label,
    value: input.label,
  })),
)
</script>
