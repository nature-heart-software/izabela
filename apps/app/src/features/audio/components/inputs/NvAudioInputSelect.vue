<template>
  <NvVirtualizedSelect
    :modelValue="settingsStore.audioInput"
    :options="options"
    @update:modelValue="(value) => settingsStore.$patch({ audioInput: value })"
  >
    <!--    <template v-for="audioInput in audioInputs" :key="audioInput.deviceId">-->
    <!--      <NvOption :label="audioInput.label" :value="audioInput.label">-->
    <!--        {{ audioInput.label }}-->
    <!--      </NvOption>-->
    <!--    </template>-->
  </NvVirtualizedSelect>
</template>
<script lang="ts" setup>
import { NvVirtualizedSelect } from '@packages/ui'
import { useDevicesList } from '@vueuse/core'
import { useSettingsStore } from '@/features/settings/store'
import { computed } from 'vue'

const settingsStore = useSettingsStore()

const { audioInputs } = useDevicesList()

const options = computed(() =>
  audioInputs.value.map((input) => ({
    label: input.label,
    value: input.label,
  })),
)
</script>
