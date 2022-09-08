<template>
  <NvSelect
    :modelValue="settingsStore.audioOutputs"
    multiple
    @update:modelValue="(value) => settingsStore.$patch({ audioOutputs: value })"
  >
    <template v-for="audioOutput in filteredAudioOutputDevices" :key="audioOutput.deviceId">
      <NvOption :label="audioOutput.label" :value="audioOutput.label">
        {{ audioOutput.label }}
      </NvOption>
    </template>
  </NvSelect>
</template>
<script lang="ts" setup>
import { computed } from 'vue'
import { NvOption, NvSelect } from '@packages/ui'
import { useDevicesList } from '@vueuse/core'
import { useStore } from 'vuex'
import { useSettingsStore } from '@/features/settings/store'

const settingsStore = useSettingsStore()
const store = useStore()
const { audioOutputs } = useDevicesList()

const filteredAudioOutputDevices = computed(() =>
  audioOutputs.value.filter((d) => d.deviceId !== 'default'),
)
</script>
