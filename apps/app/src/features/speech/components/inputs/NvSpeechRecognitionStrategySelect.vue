<template>
  <NvSelect
    ref="select"
    :autocompleteWidth="width"
    :modelValue="settingsStore.speechRecognitionStrategy"
    :options="[
             { label: 'Automatic (Native)', value: 'continuous-native' },
             { label: 'Automatic (Web)', value: 'continuous-web' },
             { label: 'Push-to-record', value: 'ptr' },
           ]"
    @update:modelValue="(value) => settingsStore.$patch({ speechRecognitionStrategy: value })"
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
