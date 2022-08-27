<template>
  <NvSelect
    :modelValue="store.getters['settings/persisted'].audioInput"
    @update:modelValue="
      (value) => store.dispatch('settings/setProperty', ['persisted.audioInput', value])
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

const store = useStore()
const { audioInputs } = useDevicesList()
</script>
