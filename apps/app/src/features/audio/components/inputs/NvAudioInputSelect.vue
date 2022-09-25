<template>
  <NvSelect
    ref="select"
    :autocompleteWidth="width"
    :modelValue="settingsStore.audioInput"
    :options="options"
    @update:modelValue="(value) => settingsStore.$patch({ audioInput: value })"
  />
</template>
<script lang="ts" setup>
import { NvSelect } from '@packages/ui'
import { useDevicesList, useElementSize } from '@vueuse/core'
import { useSettingsStore } from '@/features/settings/store'
import { computed, ref } from 'vue'

const settingsStore = useSettingsStore()

const { audioInputs } = useDevicesList()

const options = computed(() =>
  audioInputs.value.map((input) => ({
    label: input.label,
    value: input.label,
  })),
)
const select = ref()
const { width } = useElementSize(select)
</script>
