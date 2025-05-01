<template>
  <NvSelect
    ref="select"
    :autocompleteWidth="width"
    :options="[
      {
        label: 'Cloud Translation',
        value: 'cloud-translation',
      },
      {
        label: 'Custom',
        value: 'custom',
      },
    ]"
    class="shrink-0"
    v-bind="{
      modelValue: settingsStore.textTranslationStrategy,
      'onUpdate:modelValue': (value) =>
        settingsStore.$patch({ textTranslationStrategy: value }),
      ...$attrs,
    }"
  />
</template>
<script lang="ts" setup>
import { NvSelect } from '@packages/ui'
import { useElementSize } from '@vueuse/core'
import { ref } from 'vue'
import { useSettingsStore } from '@/features/settings/store'

const settingsStore = useSettingsStore()
const select = ref()
const { width } = useElementSize(select)
</script>
