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
      <NvDivider class="h-3" direction="vertical" />
      <NvButton
        :type="
          route.name === 'messages-shortcuts' && messengerContext.isViewShown ? 'plain' : 'default'
        "
        icon-name="keyboard-alt"
        size="sm"
        @click="messengerContext.navigateTo({ name: 'messages-shortcuts' })"
      />
      <NvButton
        :type="
          route.name === 'messages-history' && messengerContext.isViewShown ? 'plain' : 'default'
        "
        icon-name="history"
        size="sm"
        @click="messengerContext.navigateTo({ name: 'messages-history' })"
      />
    </NvGroup>
  </NvCard>
</template>
<script lang="ts" setup>
import { NvButton, NvCard, NvDivider, NvGroup } from '@packages/ui'
import { useSettingsStore } from '@/features/settings/store'
import { inject } from 'vue'
import { useRoute } from 'vue-router'

const settingsStore = useSettingsStore()
const messengerContext = inject('messenger')
const route = useRoute()
</script>
