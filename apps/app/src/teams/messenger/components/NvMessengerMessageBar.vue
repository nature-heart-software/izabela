<template>
  <NvCard size="sm">
    <NvGroup noWrap>
      <NvButton
        :type="settingsStore.messageMode === 'sentence' && 'plain'"
        size="sm"
        @click="settingsStore.$patch({ messageMode: 'sentence' })"
      >Sentence
      </NvButton>
      <NvButton
        :type="settingsStore.messageMode === 'word' && 'plain'"
        size="sm"
        @click="settingsStore.$patch({ messageMode: 'word' })"
      >Word
      </NvButton>
    </NvGroup>
  </NvCard>
</template>
<script lang="ts" setup>
import { NvButton, NvCard, NvGroup } from '@packages/ui'
import { useSettingsStore } from '@/features/settings/store'

const settingsStore = useSettingsStore()
</script>
