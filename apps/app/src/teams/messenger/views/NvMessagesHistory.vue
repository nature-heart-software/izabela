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
        <template v-for="{ id, message, createdAt } in messagesStore.reversedHistory" :key="id">
          <NvCard class="relative">
            <NvStack>
              <NvGroup align="start" justify="between" noWrap>
                <NvGroup align="start" class="w-full" noWrap>
                  <NvButton
                    class="shrink-0"
                    icon-name="play"
                    size="sm"
                    @click="() => !playingMessageStore.isPlaying && playMessage(id)"
                  />
                  <NvStack>
                    <NvText>{{ message || id }}</NvText>

                    <UseTimeAgo v-slot="{ timeAgo }" :time="createdAt">
                      <NvText :title="createdAt" type="caption">{{ timeAgo }}</NvText>
                    </UseTimeAgo>
                  </NvStack>
                </NvGroup>
                <NvContextMenu>
                  <NvOption>
                    <NvGroup>
                      <NvIcon :size="3" name="download-alt" />
                      Download
                    </NvGroup>
                  </NvOption>
                  <NvOption @click="messagesStore.deleteMessage(id)">
                    <NvGroup>
                      <NvIcon :size="3" name="trash-alt" />
                      Delete
                    </NvGroup>
                  </NvOption>

                  <template #reference>
                    <NvButton class="shrink-0" icon-name="ellipsis-v" size="sm" />
                  </template>
                </NvContextMenu>
              </NvGroup>
              <div
                v-if="playingMessageStore.id === id && playingMessageStore.progress < 1"
                class="h-2 relative bg-gray-10"
              >
                <div
                  :style="{ width: `${playingMessageStore.progress * 100}%` }"
                  class="h-full bg-black"
                ></div>
              </div>
            </NvStack>
          </NvCard>
        </template>
      </NvStack>
    </NvStack>
  </NvStack>
</template>
<script lang="ts" setup>
import {
  NvButton,
  NvCard,
  NvCenter,
  NvContextMenu,
  NvGroup,
  NvIcon,
  NvOption,
  NvStack,
  NvText,
} from '@packages/ui'
import { storeToRefs } from 'pinia'
import { useMessagesStore, usePlayingMessageStore } from '@/features/messages/store'
import { UseTimeAgo } from '@vueuse/components'
import { emitIPCSay } from '@/electron/events/renderer'
import { getEngineById } from '@/modules/speech-engine-manager'
import { purify } from '@packages/toolbox'

const messagesStore = useMessagesStore()
const playingMessageStore = usePlayingMessageStore()
const { history } = storeToRefs(messagesStore)
const playMessage = (id: string) => {
  const message = history.value.find((m) => m.id === id)
  if (!message) return
  const engine = getEngineById(message.engine)
  if (!engine) return
  emitIPCSay(
    purify({
      id,
      message: message.message,
      engine: message.engine,
      excludeFromHistory: true,
      payload: message.payload,
      credentials: engine.getCredentials(),
    }),
  )
}
</script>
