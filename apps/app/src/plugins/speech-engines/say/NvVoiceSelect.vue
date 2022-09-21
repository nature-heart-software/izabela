<template>
  <NvVirtualizedSelect
    v-loading="isFetching"
    :modelValue="getProperty('selectedVoice')"
    :options="options"
    v-bind="$attrs"
    @update:modelValue="(value) => setProperty('selectedVoice', value)"
  >
    <!--    <NvOption :value="null" label="Default">Default</NvOption>-->
    <!--    <template v-for="voice in voices" :key="voice">-->
    <!--      <NvOption :label="voice" :value="voice">-->
    <!--        {{ voice }}-->
    <!--      </NvOption>-->
    <!--    </template>-->
  </NvVirtualizedSelect>
</template>
<script lang="ts" setup>
import { computed } from 'vue'
import { NvVirtualizedSelect } from '@packages/ui'
import { sortBy } from 'lodash'
import { useListVoicesQuery } from './hooks'
import { getProperty, setProperty } from './store'

const { data, isFetching } = useListVoicesQuery()
const voices = computed(() => sortBy(data.value || []))
const options = computed(() => [
  { label: 'Default', value: null },
  ...voices.value.map((voice) => ({
    label: voice,
    value: voice,
  })),
])
</script>
