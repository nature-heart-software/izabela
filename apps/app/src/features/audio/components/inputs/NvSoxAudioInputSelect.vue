<template>
  <NvSelect
    ref="select"
    :autocompleteWidth="width"
    :modelValue="settingsStore.soxDevice"
    :options="options"
    @update:modelValue="(value) => settingsStore.$patch({ soxDevice: value })"
  />
</template>
<script lang="ts" setup>
import { NvSelect } from '@packages/ui'
import { useSettingsStore } from '@/features/settings/store'
import { useElementSize } from '@vueuse/core'
import { computed, ref } from 'vue'
import { useSoxDevicesList } from '@/features/audio/hooks'

const settingsStore = useSettingsStore()
const audioInputs = useSoxDevicesList()
const options = computed(() =>
  audioInputs.value.map((input, i) => ({
    label: input.label,
    value: i,
  })),
)
const select = ref()
const { width } = useElementSize(select)
</script>
