<template>
  <NvStack spacing="6">
    <NvStack>
      <NvGroup justify="between">
        <NvText type="subtitle">Last 50 messages</NvText>
      </NvGroup>
      <NvStack spacing="4">
        <template v-if="messagesStore.reversedHistory.length === 0">
          <NvCard>
            <NvCenter>
              <NvText>Send a message to see it appear here</NvText>
            </NvCenter>
          </NvCard>
        </template>
        <template v-for="({ id }, i) in messagesStore.reversedHistory" :key="`${i}-${id}`">
          <NvHistoryMessage :id="id"/>
        </template>
      </NvStack>
    </NvStack>
  </NvStack>
</template>
<script lang="ts" setup>
import { NvCard, NvCenter, NvGroup, NvStack, NvText } from '@packages/ui'
import { useMessagesStore } from '@/features/messages/store'

import NvHistoryMessage from '@/teams/messenger/components/NvHistoryMessage.vue'

const messagesStore = useMessagesStore()
</script>
