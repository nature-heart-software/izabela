<template>
  <NvSelect
    v-loading="isFetching"
    :modelValue="store.getters['settings/persisted'].SayTTSSelectedVoice"
    v-bind="$attrs"
    @update:modelValue="
      (value) =>
        store.dispatch('settings/setProperty', ['persisted.SayTTSSelectedVoice', value])
    "
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
import { useSayTTSListVoicesQuery } from '@/entities/speech/services'
import { sortBy } from 'lodash'
import { useStore } from 'vuex'

const { data, isFetching } = useSayTTSListVoicesQuery()
const voices = computed(() => sortBy(data.value || []))
const store = useStore()
</script>
