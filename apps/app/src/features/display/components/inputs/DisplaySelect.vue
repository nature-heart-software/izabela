<template>
  <NvSelect
    v-loading="isFetching"
    :modelValue="settingsStore.display || primaryDisplay?.id"
    @update:modelValue="onUpdate"
  >
    <template v-for="display in displays" :key="display.id">
      <NvOption
        :label="`${(primaryDisplay && display.id === primaryDisplay.id && '(Primary) ') || ''}${
          display.id
        }`"
        :value="display.id"
      >
        <template v-if="primaryDisplay && display.id === primaryDisplay.id"> (Primary)</template>
        {{ display.id }}
      </NvOption>
    </template>
  </NvSelect>
</template>
<script lang="ts" setup>
import { NvOption, NvSelect } from '@packages/ui'
import { computed } from 'vue'
import type Electron from 'electron'
import {
  useGetAllDisplaysQuery,
  useGetPrimaryDisplayQuery,
} from '@/features/display/components/hooks'
import { useSettingsStore } from '@/features/settings/store'

const { ElectronDisplay } = window

const settingsStore = useSettingsStore()
const { data, isFetching: isAllDisplayFetching } = useGetAllDisplaysQuery()
const { data: primaryDisplay, isFetching: isPrimaryDisplayFetching } = useGetPrimaryDisplayQuery()
const displays = computed(() => data.value || [])
const isFetching = computed(() =>
  [isAllDisplayFetching.value, isPrimaryDisplayFetching.value].some(Boolean),
)

const onUpdate = (value: Electron.Display['id']) => {
  settingsStore.$patch({ display: value })
}
</script>
