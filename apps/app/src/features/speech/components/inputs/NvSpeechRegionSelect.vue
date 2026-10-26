<template>
  <NvStack :spacing="3">
    <label>
      <NvStack :spacing="3">
        <NvText type="label">Region</NvText>
        <NvSelect
          v-model="selectedRegion"
          v-loading="isLoading"
          :options="options"
          :aria-busy="isLoading"
        />
      </NvStack>
    </label>
  </NvStack>
</template>
<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { NvSelect, NvStack, NvText } from '@packages/ui'
import type { SpeechEngine } from '@/modules/speech-engine-manager/types'
import { useSettingsStore } from '@/features/settings/store'

const props = defineProps<{ engine: SpeechEngine }>()
const settingsStore = useSettingsStore()
const regions = ref<
  Awaited<ReturnType<NonNullable<SpeechEngine['getRegions']>>>
>([])
const isLoading = ref(false)
const selectedRegion = computed({
  get: () => props.engine.store.getProperty('remoteRegion') || 'auto',
  set: (value) =>
    props.engine.store.setProperty(
      'remoteRegion',
      value === 'auto' ? '' : value,
    ),
})
const options = computed(() => {
  const choices = [
    { label: 'Auto', value: 'auto' },
    ...regions.value
      .filter((region) => region.value !== 'auto')
      .map(({ name, value }) => ({ label: name, value })),
  ]
  if (!choices.some(({ value }) => value === selectedRegion.value)) {
    choices.push({ label: selectedRegion.value, value: selectedRegion.value })
  }
  return choices
})

watch(
  () => [
    props.engine,
    settingsStore.universalApiEndpoint,
    settingsStore.universalApiKey,
  ],
  async (_, __, onCleanup) => {
    let active = true
    onCleanup(() => {
      active = false
    })
    regions.value = []
    isLoading.value = true
    try {
      const data = await props.engine.getRegions?.()
      if (active && Array.isArray(data)) {
        regions.value = data.filter(
          (region) =>
            region &&
            typeof region.name === 'string' &&
            typeof region.value === 'string',
        )
      }
    } catch {
      // Region discovery is optional; keep Auto available if it fails.
    } finally {
      if (active) isLoading.value = false
    }
  },
  { immediate: true },
)
</script>
