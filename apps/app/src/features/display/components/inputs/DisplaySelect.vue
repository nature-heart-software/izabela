<template>
  <NvSelect
    v-loading="isFetching"
    :modelValue="selectedDisplay?.id"
    :options="options"
    @update:modelValue="onUpdate"
  />
</template>
<script lang="ts" setup>
import { NvSelect } from '@packages/ui'
import { computed } from 'vue'
import type Electron from 'electron'
import {
  useGetAllDisplaysQuery,
  useGetPrimaryDisplayQuery,
} from '@/features/display/components/hooks'
import { useSettingsStore } from '@/features/settings/store'
import { findDisplay } from '@/features/display/utils'

const settingsStore = useSettingsStore()
const { data, isFetching: isAllDisplayFetching } = useGetAllDisplaysQuery()
const { data: primaryDisplay, isFetching: isPrimaryDisplayFetching } =
  useGetPrimaryDisplayQuery()
const displays = computed(() => data.value || [])
const selectedDisplay = computed(
  () =>
    findDisplay(
      displays.value,
      settingsStore.display,
      settingsStore.displayBounds,
    ) || primaryDisplay.value,
)
const isFetching = computed(() =>
  [isAllDisplayFetching.value, isPrimaryDisplayFetching.value].some(Boolean),
)
const options = computed(() =>
  displays.value.map((display) => ({
    label: `${
      (primaryDisplay &&
        display.id === primaryDisplay.value?.id &&
        '(Primary) ') ||
      ''
    }${display.id}`,
    value: display.id,
  })),
)

const onUpdate = (value: Electron.Display['id']) => {
  const display = displays.value.find((d) => d.id === value)
  settingsStore.$patch({
    display: value,
    displayBounds: display?.bounds ?? null,
  })
}
</script>
