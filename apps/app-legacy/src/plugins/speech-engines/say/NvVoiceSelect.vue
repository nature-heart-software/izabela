<template>
  <NvSelect
    v-loading="isFetching"
    :options="options"
    v-bind="{
      modelValue: getProperty('selectedVoice'),
      'onUpdate:modelValue': (value) => setProperty('selectedVoice', value),
      ...$attrs,
    }"
  >
    <template #optionAfter="{ option, hover }">
      <span v-show="(!option.children && hover) || favoriteVoiceIds.includes(option.id)">
        <NvButton
          :icon-name="favoriteVoiceIds.includes(option.id) ? 'times' : 'heart'"
          :title="
            favoriteVoiceIds.includes(option.id) ? 'Remove from favorites' : 'Add to favorites'
          "
          size="sm"
          type="default"
          @mousedown.prevent.stop="
            setProperty('favoriteVoiceIds', xor(favoriteVoiceIds, [option.id]))
          "
        />
      </span>
    </template>
  </NvSelect>
</template>
<script lang="ts" setup>
import { computed } from 'vue'
import { NvButton, NvSelect } from '@packages/ui'
import { sortBy, xor } from 'lodash'
import { groupOptions } from '@/utils/select'
import { getVoiceCategory, getVoiceId, getVoiceName } from './shared'

import { useListVoicesQuery } from './hooks'
import { getProperty, setProperty } from './store'

const { data, isFetching } = useListVoicesQuery()
const voices = computed(() => sortBy(['Default', ...(data.value || [])]))
const getOptionFromVoice = (voice: any) => ({
  id: getVoiceId(voice),
  label: getVoiceName(voice),
  value: voice === 'Default' ? null : voice,
  category: getVoiceCategory(voice),
})

const options = computed(() => {
  const localOptions = groupOptions(voices.value.map(getOptionFromVoice), 'category')
  const favoriteVoiceIds = getProperty('favoriteVoiceIds')
  if (favoriteVoiceIds) {
    const favoriteVoices = voices.value.filter((voice: any) =>
      favoriteVoiceIds.includes(getVoiceId(voice)),
    )
    if (favoriteVoices.length) {
      localOptions.unshift({
        label: 'Favorites',
        children: favoriteVoices.map(getOptionFromVoice),
      })
    }
  }
  return localOptions
})

const favoriteVoiceIds = computed<string[]>(() => getProperty('favoriteVoiceIds'))
</script>
