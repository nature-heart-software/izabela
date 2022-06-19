<template>
  <NvSelect v-bind="$attrs">
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
import { useSayTTSListVoicesQuery } from '@/entities/speech/services'
import { sortBy } from 'lodash'

const { data } = useSayTTSListVoicesQuery()
const voices = computed(() => sortBy(data.value || []))
</script>
