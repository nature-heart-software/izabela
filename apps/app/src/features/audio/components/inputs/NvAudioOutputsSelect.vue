<template>
  <NvVirtualizedSelect
    :modelValue="settingsStore.audioOutputs"
    :options="options"
    multiple
    @update:modelValue="(value) => settingsStore.$patch({ audioOutputs: value })"
  >
    <!--    <template v-for="audioOutput in filteredAudioOutputDevices" :key="audioOutput.deviceId">-->
    <!--      <NvOption :label="audioOutput.label" :value="audioOutput.label">-->
    <!--        {{ audioOutput.label }}-->
    <!--      </NvOption>-->
    <!--    </template>-->
  </NvVirtualizedSelect>
</template>
<script lang="ts" setup>
import { computed, watch } from 'vue'
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
watch(
  options,
  (value) => {
    console.log(value, settingsStore.audioOutputs)
  },
  { immediate: true },
)
</script>
