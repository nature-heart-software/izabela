<template>
  <NvSelect
    v-loading="isFetching"
    :options="options"
    v-bind="{
      modelValue: getProperty('selectedVoice'),
      'onUpdate:modelValue': (value) => setProperty('selectedVoice', purify(value)),
      ...$attrs,
    }"
    valueKey="name"
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
import { computed, watch } from 'vue'
import { useQueryClient } from 'vue-query'
import { NvButton, NvSelect } from '@packages/ui'
import { purify } from '@packages/toolbox'
import { useSpeechStore } from '@/features/speech/store'
import { groupOptions } from '@/utils/select'
import xor from 'lodash/xor'
import { getVoiceCategory, getVoiceId, getVoiceName, LIST_VOICES_QUERY_KEY } from './shared'
import { useListVoicesQuery } from './hooks'

import { getProperty, setProperty } from './store'

const queryClient = useQueryClient()
const computedParams = computed(() => ({
  credentials: {},
}))
const speechStore = useSpeechStore()
const canFetch = computed(() => speechStore.hasUniversalApiCredentials)
const { data, isFetching } = useListVoicesQuery(computedParams, {
  enabled: canFetch,
})
const voices = computed(() => [
  {
    id: 'Default',
    name: 'Default',
    value: null,
    category: 'General',
  },
  ...(data.value || []),
])
const getOptionFromVoice = (voice: any) => ({
  id: getVoiceId(voice),
  label: getVoiceName(voice),
  value: voice.name === 'Default' ? null : voice,
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
watch(
  () => canFetch.value,
  () => canFetch.value && queryClient.refetchQueries(LIST_VOICES_QUERY_KEY),
)
</script>
