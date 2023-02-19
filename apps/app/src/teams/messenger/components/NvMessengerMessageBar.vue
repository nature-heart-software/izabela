<template>
  <NvCard size="sm">
    <NvGroup noWrap>
      <NvTooltip>
        <NvText>Message mode</NvText>
        <template #reference>
          <NvGroup data-v-step="8" noWrap>
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
        </template>
      </NvTooltip>
      <NvDivider class="h-3" direction="vertical"/>
      <NvTooltip>
        <NvText>Message shortcuts</NvText>
        <template #reference>
          <NvButton
            :type="route.name === 'messages-shortcuts' && messengerContext.isViewShown.value  ?  'plain'  :  'default'"
            data-v-step="9"
            icon-name="keyboard-alt"
            size="sm"
            @click="messengerContext.navigateTo({ name: 'messages-shortcuts' })"
          />
        </template>
      </NvTooltip>
      <NvTooltip>
        <NvText>Message history</NvText>
        <template #reference>
          <NvButton
            :type="route.name === 'messages-history' && messengerContext.isViewShown.value  ?  'plain'  :  'default'"
            data-v-step="10"
            icon-name="history"
            size="sm"
            @click="messengerContext.navigateTo({ name: 'messages-history' })"
          />
        </template>
      </NvTooltip>
    </NvGroup>
  </NvCard>
</template>
<script lang="ts" setup>
import { NvButton, NvCard, NvDivider, NvGroup, NvText, NvTooltip } from '@packages/ui'
import { useSettingsStore } from '@/features/settings/store'
import { inject } from 'vue'
import { useRoute } from 'vue-router'

const settingsStore = useSettingsStore()
const messengerContext = inject('messenger')
const route = useRoute()
</script>
