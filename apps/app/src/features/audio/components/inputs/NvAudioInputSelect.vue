<template>
  <NvSelect
    :modelValue="settingsStore.audioInput"
    @update:modelValue="
      (value) => settingsStore.$patch({ audioInput: value })
    "
  >
    <template v-for="audioInput in audioInputs" :key="audioInput.deviceId">
      <NvOption :label="audioInput.label" :value="audioInput.label">
        {{ audioInput.label }}
      </NvOption>
    </template>
  </NvSelect>
</template>
<script lang="ts" setup>
import { NvOption, NvSelect } from '@packages/ui'
import { useStore } from 'vuex'
import { useDevicesList } from '@vueuse/core'
import { useSettingsStore } from '@/features/settings/store'

const settingsStore = useSettingsStore()
const store = useStore()
const { audioInputs } = useDevicesList()
</script>
