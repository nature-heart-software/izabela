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
          <NvCard>
            <NvStack v-loading="downloading.includes(id)">
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
                <NvContextMenu
                  :options="[
                    {
                      label: 'Download',
                      icon: 'download-alt',
                      onClick: () => {
                        downloadMessageLocally(id)
                      },
                    },
                    {
                      type: 'divider',
                    },
                    {
                      label: 'Delete',
                      icon: 'trash-alt',
                      onClick: () => {
                        messagesStore.deleteMessage(id)
                      },
                    },
                  ]"
                >
                  <NvButton class="shrink-0" icon-name="ellipsis-v" size="sm" />
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
import { NvButton, NvCard, NvCenter, NvContextMenu, NvGroup, NvStack, NvText } from '@packages/ui'
import { storeToRefs } from 'pinia'
import { useMessagesStore, usePlayingMessageStore } from '@/features/messages/store'
import { UseTimeAgo } from '@vueuse/components'
import { emitIPCSay } from '@/electron/events/renderer'
import { getEngineById } from '@/modules/speech-engine-manager'
import { purify } from '@packages/toolbox'
import IzabelaMessage from '@/modules/izabela/IzabelaMessage'
import { ref } from 'vue'

const { ElectronFilesystem } = window
const messagesStore = useMessagesStore()
const playingMessageStore = usePlayingMessageStore()
const { history } = storeToRefs(messagesStore)
const downloading = ref<string[]>([])
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
const downloadMessageLocally = async (id: string) => {
  downloading.value.push(id)
  try {
    const message = history.value.find((m) => m.id === id)
    if (!message) return
    const engine = getEngineById(message.engine)
    if (!engine) return
    const completeMessage = purify({
      id,
      message: message.message,
      engine: message.engine,
      payload: message.payload,
      credentials: engine.getCredentials(),
      excludeFromHistory: true,
      disableAutoplay: true,
    })
    IzabelaMessage(completeMessage)
      .downloadAudio()
      .then(({ data }) => {
        const reader = new FileReader()
        reader.onload = () => {
          ElectronFilesystem.downloadMessagePrompt(
            completeMessage,
            reader.result as string,
          ).finally(() => {
            downloading.value = downloading.value.filter((d) => d !== id)
          })
        }
        reader.readAsDataURL(data)
      })
  } catch (error) {
    downloading.value = downloading.value.filter((d) => d !== id)
  }
}
</script>
