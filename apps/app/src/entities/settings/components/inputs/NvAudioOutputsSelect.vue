<template>
  <NvSelect
    :modelValue="store.getters['settings/persisted'].audioOutputDevices"
    multiple
    @update:modelValue="
          (value) => store.dispatch('settings/setProperty', ['persisted.audioOutputDevices', value])
        "
  >
    <template
      v-for="audioOutputDevice in filteredAudioOutputDevices"
      :key="audioOutputDevice.deviceId"
    >
      <NvOption :label="audioOutputDevice.label" :value="audioOutputDevice.label">
        {{ audioOutputDevice.label }}
      </NvOption>
    </template>
  </NvSelect>
</template>
<script lang="ts" setup>
import { computed } from 'vue'
import {
  NvOption,
  NvSelect,
} from '@packages/ui'
import { useMediaDevices } from '@/hooks'
import { useStore } from 'vuex'

const store = useStore()
const { audioOutputDevices } = useMediaDevices()

const filteredAudioOutputDevices = computed(() =>
  audioOutputDevices.value.filter((d) => d.deviceId !== 'default'),
)
</script>
