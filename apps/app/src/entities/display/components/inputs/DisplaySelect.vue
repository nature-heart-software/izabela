<template>
  <NvSelect
    v-loading="isFetching"
    :modelValue="store.getters['settings/persisted'].display || primaryDisplay?.id"
    @update:modelValue="onUpdate"
  >
    <template v-for="display in displays" :key="display.id">
      <NvOption
        :value="display.id"
        :label="`${(primaryDisplay && display.id === primaryDisplay.id && '(Primary) ') || ''}${
          display.id
        }`"
      >
        <template v-if="primaryDisplay && display.id === primaryDisplay.id"> (Primary) </template>
        {{ display.id }}
      </NvOption>
    </template>
  </NvSelect>
</template>
<script lang="ts" setup>
import { NvSelect, NvOption } from '@packages/ui'
import {
  useGetAllDisplaysQuery,
  useGetPrimaryDisplayQuery,
} from '@/entities/display/components/hooks'
import { computed } from 'vue'
import { useStore } from 'vuex'
import type Electron from 'electron'

const { ElectronDisplay } = window

const { data, isFetching: isAllDisplayFetching } = useGetAllDisplaysQuery()
const { data: primaryDisplay, isFetching: isPrimaryDisplayFetching } = useGetPrimaryDisplayQuery()
const displays = computed(() => data.value || [])
const isFetching = computed(() =>
  [isAllDisplayFetching.value, isPrimaryDisplayFetching.value].some(Boolean),
)
const store = useStore()
const onUpdate = (value: Electron.Display['id']) => {
  store.dispatch('settings/setProperty', ['persisted.display', value])
}
</script>
