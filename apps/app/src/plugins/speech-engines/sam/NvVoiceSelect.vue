<template>
  <NvSelect
    :options="options"
    v-bind="{
      modelValue: getProperty('selectedVoice'),
      'onUpdate:modelValue': (value) => setProperty('selectedVoice', purify(value)),
      ...$attrs,
    }"
    valueKey="name"
  >
    <template #optionAfter="{ option }">
      <NvButton
        v-if="!option.children"
        :type="favoriteVoiceIds.includes(option.id) ? 'plain' : 'default'"
        icon-name="heart"
        size="sm"
        @mousedown.prevent.stop="
          setProperty('favoriteVoiceIds', xor(favoriteVoiceIds, [option.id]))
        "
      />
    </template>
  </NvSelect>
</template>
<script lang="ts" setup>
import { computed } from 'vue'
import { NvButton, NvSelect } from '@packages/ui'
import { xor } from 'lodash'
import { groupOptions } from '@/utils/select'
import { getProperty, setProperty } from './store'
import { getVoiceCategory, getVoiceId, getVoiceName, voices as defaultVoices } from './shared'

const voices = computed(() => [
  {
    name: 'Custom',
  },
  ...defaultVoices,
])
const getOptionFromVoice = (voice: any) => ({
  id: getVoiceId(voice),
  label: getVoiceName(voice),
  value: voice,
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
