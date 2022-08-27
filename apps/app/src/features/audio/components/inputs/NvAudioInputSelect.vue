<template>
  <NvSelect
    :modelValue="store.getters['settings/persisted'].audioInputDevice"
    @update:modelValue="
      (value) => store.dispatch('settings/setProperty', ['persisted.audioInputDevice', value])
    "
  >
    <template v-for="audioInputDevice in audioInputDevices" :key="audioInputDevice.deviceId">
      <NvOption :label="audioInputDevice.label" :value="audioInputDevice.label">
        {{ audioInputDevice.label }}
      </NvOption>
    </template>
  </NvSelect>
</template>
<script lang="ts" setup>
import { NvOption, NvSelect } from '@packages/ui'
import { useStore } from 'vuex'
import { useMediaDevices } from '@/hooks'

const store = useStore()
const { audioInputDevices } = useMediaDevices()
</script>
