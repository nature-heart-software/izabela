<template>
  <NvSelect
    ref="select"
    v-loading="isFetching"
    :autocompleteWidth="width"
    :options="options"
    v-bind="$attrs"
  />
</template>
<script lang="ts" setup>
import { NvSelect } from '@packages/ui'
import { useElementSize } from '@vueuse/core'
import { computed, ref, unref } from 'vue'
import { useGetLanguagesQuery } from './queries.ts'
import { groupOptions } from '@/utils/select.ts'

const select = ref()
const { width } = useElementSize(select)
const { data, isFetching } = useGetLanguagesQuery()
const options = computed(() => {
  const languages = unref(data)?.from || []
  return groupOptions(
    [
      {
        label: 'Auto',
        value: null,
        category: 'Default',
      },
      ...languages.map((language) => ({
        label: language.name,
        value: language.value,
        category: language.category,
      })),
    ],
    'category',
  )
})
</script>
