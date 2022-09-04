<template>
  <NvSelect
    :modelValue="store.getters['settings/persisted'].audioOutputs"
    multiple
    @update:modelValue="
      (value) => store.dispatch('settings/setProperty', ['persisted.audioOutputs', value])
    "
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

const store = useStore()
const { audioOutputs } = useDevicesList()

const filteredAudioOutputDevices = computed(() =>
  audioOutputs.value.filter((d) => d.deviceId !== 'default'),
)
</script>
