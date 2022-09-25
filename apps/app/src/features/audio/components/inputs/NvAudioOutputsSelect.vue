<template>
  <NvSelect
    ref="select"
    :autocompleteWidth="width"
    :modelValue="settingsStore.audioOutputs"
    :options="options"
    multiple
    @update:modelValue="(value) => settingsStore.$patch({ audioOutputs: value })"
  />
</template>
<script lang="ts" setup>
import { computed, ref } from 'vue'
import { NvSelect } from '@packages/ui'
import { useDevicesList, useElementSize } from '@vueuse/core'
import { useSettingsStore } from '@/features/settings/store'

const settingsStore = useSettingsStore()

const { audioOutputs } = useDevicesList()

const options = computed(() =>
  audioOutputs.value.map((output) => ({
    label: output.label,
    value: output.label,
  })),
)
const select = ref()
const { width } = useElementSize(select)
</script>
