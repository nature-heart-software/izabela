<template>
  <NvSelect
    v-loading="isFetching"
    :modelValue="settingsStore.display || primaryDisplay?.id"
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

const settingsStore = useSettingsStore()
const { data, isFetching: isAllDisplayFetching } = useGetAllDisplaysQuery()
const { data: primaryDisplay, isFetching: isPrimaryDisplayFetching } = useGetPrimaryDisplayQuery()
const displays = computed(() => data.value || [])
const isFetching = computed(() =>
  [isAllDisplayFetching.value, isPrimaryDisplayFetching.value].some(Boolean),
)
const options = computed(() =>
  displays.value.map((display) => ({
    label: `${(primaryDisplay && display.id === primaryDisplay.value?.id && '(Primary) ') || ''}${
      display.id
    }`,
    value: display.id,
  })),
)

const onUpdate = (value: Electron.Display['id']) => {
  settingsStore.$patch({ display: value })
}
</script>
