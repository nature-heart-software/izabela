<template>
  <NvCard>
    <NvStack v-loading="downloading">
      <NvGroup align="start" justify="between" noWrap>
        <NvGroup align="start" class="!flex-1 min-w-0" noWrap>
          <NvButton
            :loading="isLoading"
            class="shrink-0"
            icon-name="play"
            size="sm"
            @click="() => play()"
          />
          <NvStack class="!flex-1 min-h-0">
            <NvText>{{ message.message || id }}</NvText>
            <NvText type="caption">
              <NvGroup class="w-full" justify="between" noWrap>
                <span class="truncate">
                  {{ engine.name }} - {{ engine.getVoiceName(message.voice) }}
                </span>
                <span class="whitespace-nowrap">
                  <UseTimeAgo v-slot="{ timeAgo }" :time="message.createdAt">
                    {{ timeAgo }}
                  </UseTimeAgo>
                </span>
              </NvGroup>
            </NvText>
          </NvStack>
        </NvGroup>
        <NvContextMenu
          :options="[
            {
              label: 'Download',
              icon: 'download-alt',
              onClick: () => {
                downloadMessageLocally()
              },
            },
            {
              type: 'divider',
            },
            {
              label: 'Delete',
              icon: 'trash-alt',
              onClick: () => {
                messagesStore.removeHistoryMessage(id)
              },
            },
          ]"
        >
          <NvButton class="shrink-0" icon-name="ellipsis-v" size="sm"/>
        </NvContextMenu>
      </NvGroup>
      <div
        v-if="isPlaying"
        class="h-2 relative bg-gray-10"
      >
        <div
          :style="{ width: `${progress * 100}%` }"
          class="h-full bg-black"
        ></div>
      </div>
    </NvStack>
  </NvCard>
</template>
<script lang="ts" setup>
import { NvButton, NvCard, NvContextMenu, NvGroup, NvStack, NvText } from '@packages/ui'
import { useMessagesStore, usePlayingMessageStore } from '@/features/messages/store'
import { storeToRefs } from 'pinia'
import { computed, defineProps, ref, watch } from 'vue'
import { getEngineById } from '@/modules/speech-engine-manager'
import { purify } from '@packages/toolbox'
import IzabelaMessage from '@/modules/izabela/IzabelaMessage'
import { UseTimeAgo } from '@vueuse/components'
import { useDateFormat } from '@vueuse/core'
import { usePlayMessage } from '@/features/messages/hooks'

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
})

const { ElectronFilesystem } = window
const messagesStore = useMessagesStore()
const playingMessageStore = usePlayingMessageStore()
const { history } = storeToRefs(messagesStore)
const downloading = ref(false)
const requestingToPlay = ref(false)
const message = computed(() => history.value.find((m) => m.id === props.id))
const engine = computed(() => {
  if (!message.value) return null
  return getEngineById(message.value.engine)
})
const formatedCreatedAt = useDateFormat(message.value?.createdAt, 'YYYYMMDDHHmmss')

watch(
  () => playingMessageStore.progress,
  () => {
    if (playingMessageStore.id === props.id) {
      requestingToPlay.value = false
    }
  },
)

const downloadMessageLocally = async () => {
  downloading.value = true
  try {
    if (!message.value || !engine.value) return
    const completeMessage = purify({
      id: props.id,
      message: message.value.message,
      engine: message.value.engine,
      payload: message.value.payload,
      voice: message.value.voice,
      credentials: engine.value.getCredentials(),
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
            `${ formatedCreatedAt.value } - ${ engine.value?.name } - ${ engine.value?.getVoiceName(
              message.value?.voice,
            ) } - ${ message.value?.message }`.replace(/([^a-z0-9\s-]+)/gi, '_'),
            reader.result as string,
          ).finally(() => {
            downloading.value = false
          })
        }
        reader.readAsDataURL(data)
      })
  } catch (error) {
    downloading.value = false
  }
}

const playMessage = computed(() => ({
  id: props.id,
  message: message.value?.message || '',
  engine: message.value?.engine || '',
  voice: engine.value?.getSelectedVoice(),
  excludeFromHistory: true,
}))
const { play, isPlaying, isLoading, progress } = usePlayMessage(playMessage)
</script>
