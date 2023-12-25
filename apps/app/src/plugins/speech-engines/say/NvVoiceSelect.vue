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
    <template #optionAfter="{option}">
      <NvButton v-if="!option.children"
                :type="favoriteVoiceIds.includes(option.id) ? 'plain' : 'default'"
                icon-name="heart" size="sm"
                @mousedown.prevent.stop="setProperty('favoriteVoiceIds', xor(favoriteVoiceIds, [option.id]))"/>
    </template>
  </NvSelect>
</template>
<script lang="ts" setup>
import { computed } from 'vue'
import { NvButton, NvSelect } from '@packages/ui'
import { sortBy, xor } from 'lodash'
import { getVoiceCategory, getVoiceId, getVoiceName } from '@/plugins/speech-engines/say/shared'

import { groupOptions } from '@/utils/select'
import { useListVoicesQuery } from './hooks'
import { getProperty, setProperty } from './store'

const { data, isFetching } = useListVoicesQuery()
const voices = computed(() => sortBy(data.value || []))
const getOptionFromVoice = (voice: any) => ({
  id: getVoiceId(voice),
  label: getVoiceName(voice),
  value: voice,
  category: getVoiceCategory(voice),
})

const options = computed(() => {
    const localOptions = [
      { id: null, label: 'Default', value: null, category: 'Default' },
      ...groupOptions(voices.value.map(getOptionFromVoice), 'category'),
    ]
    const favoriteVoiceIds = getProperty('favoriteVoiceIds')
    if (favoriteVoiceIds) {
      const favoriteVoices = voices.value.filter((voice: any) => favoriteVoiceIds.includes(getVoiceId(voice)))
      if (favoriteVoices.length) {
        localOptions.unshift({
          label: 'Favorites',
          children: favoriteVoices.map(getOptionFromVoice),
        })
      }
    }
    return localOptions
  },
)

const favoriteVoiceIds = computed<string[]>(() => getProperty('favoriteVoiceIds'))

</script>
