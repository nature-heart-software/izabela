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
import { useElementSize } from '@vueuse/core'
import { useAudioDevices } from '@/features/audio/hooks'
import { computed, ref } from 'vue'
import { useSettingsStore } from '@/features/settings/store'

const settingsStore = useSettingsStore()

const { audioInputs } = useAudioDevices()

const options = computed(() =>
  audioInputs.value.map((input) => ({
    label: input.label,
    value: input.label,
  })),
)
const select = ref()
const { width } = useElementSize(select)
</script>
