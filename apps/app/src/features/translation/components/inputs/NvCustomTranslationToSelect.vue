<template>
  <NvSelect
    ref="select"
    v-loading="isFetching"
    :autocompleteWidth="width"
    :modelValue="settingsStore.customTextTranslationTo"
    :options="options"
    placeholder="Select a language"
    @update:modelValue="(value) => settingsStore.$patch({ customTextTranslationTo: value })"
  />
</template>
<script lang="ts" setup>
import { NvSelect } from '@packages/ui'
import { useElementSize } from '@vueuse/core'
import { computed, ref } from 'vue'
import { useSettingsStore } from '@/features/settings/store'
import { useGetCustomLanguagesQuery } from '@/features/translation/hooks/useGetCustomLanguagesQuery'

const settingsStore = useSettingsStore()
const select = ref()
const { width } = useElementSize(select)
const { data, isFetching } = useGetCustomLanguagesQuery()
const options = computed(
  () =>
    data.value?.to.map((language) => ({
      label: language.name,
      value: language.id,
    })) || [],
)
</script>
