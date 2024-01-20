<template>
  <NvStack class="h-full" spacing="6">
    <NvStack class="min-h-0">
      <NvGroup justify="between">
        <NvText type="subtitle">Last 50 messages</NvText>
      </NvGroup>
      <NvStack ref="containerRef" class="!flex-1 overflow-y-auto" spacing="4" @wheel="onWheel">
        <template v-if="messagesStore.history.length === 0">
          <NvCard>
            <NvCenter>
              <NvText>No messages</NvText>
            </NvCenter>
          </NvCard>
        </template>
        <template v-for="{ id } in messagesStore.history" :key="id">
          <NvHistoryMessage :id="id" />
        </template>
      </NvStack>
    </NvStack>
  </NvStack>
</template>
<script lang="ts" setup>
import { NvCard, NvCenter, NvGroup, NvStack, NvText } from '@packages/ui'
import { useMessagesStore, usePlayingMessageStore } from '@/features/messages/store'

import NvHistoryMessage from '@/teams/messenger/components/NvHistoryMessage.vue'
import { nextTick, ref, watch } from 'vue'

const autoScroll = ref(true)
const containerRef = ref()
const messagesStore = useMessagesStore()
const playingMessageStore = usePlayingMessageStore()

watch(
  () => [
    messagesStore.history,
    containerRef,
    playingMessageStore.progress,
    playingMessageStore.isPlaying,
  ],
  () => {
    if (autoScroll.value && containerRef.value) {
      nextTick(() => {
        containerRef.value.$el.scrollTop = containerRef.value.$el.scrollHeight
      })
    }
  },
  { deep: true, immediate: true },
)

const onWheel = () => {
  const element = containerRef.value.$el
  autoScroll.value = !!(
    element && element.scrollHeight - element.scrollTop === element.clientHeight
  )
}
</script>
