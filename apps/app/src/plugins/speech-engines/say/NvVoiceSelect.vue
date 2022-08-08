<template>
  <NvSelect
    v-loading="isFetching"
    :modelValue="getProperty('selectedVoice')"
    v-bind="$attrs"
    @update:modelValue="(value) => setProperty('selectedVoice', value)"
  >
    <NvOption :value="null" label="Default">Default</NvOption>
    <template v-for="voice in voices" :key="voice">
      <NvOption :label="voice" :value="voice">
        {{ voice }}
      </NvOption>
    </template>
  </NvSelect>
</template>
<script lang="ts" setup>
import { computed } from 'vue'
import { NvOption, NvSelect } from '@/core/components'
import { sortBy } from 'lodash'
import { useListVoicesQuery } from './hooks'
import { getProperty, setProperty } from './store'

const { data, isFetching } = useListVoicesQuery()
const voices = computed(() => sortBy(data.value || []))
</script>
