// eslint-disable-next-line import/no-cycle
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { IzabelaHistoryMessage, IzabelaMessagePayload } from '@/modules/izabela/types'

export const usePlayingMessageStore = defineStore(
  'playing-message',
  () => {
    const id = ref<string | null>(null)
    const progress = ref(0)
    const isPlaying = ref(false)
    return {
      id,
      progress,
      isPlaying,
    }
  },
  {
    electron: {
      shared: true,
    },
  },
)
export const useMessagesStore = defineStore(
  'messages',
  () => {
    const history = ref<IzabelaHistoryMessage[]>([])
    const addToHistory = (
      id: string,
      { engine, payload, message, voice }: IzabelaMessagePayload,
    ): IzabelaHistoryMessage => {
      const historyMessage: IzabelaHistoryMessage = {
        id,
        engine,
        payload,
        message,
        voice,
        createdAt: new Date().toISOString(),
      }
      if (history.value.length === 50) {
        history.value.splice(0, 1)
      }
      history.value.push(historyMessage)
      return historyMessage
    }
    const deleteMessage = (id: string) => {
      history.value = history.value.filter((message) => message.id !== id)
    }
    const clearHistory = () => {
      history.value = []
    }

    const reversedHistory = computed(() => history.value.slice().reverse())
    return {
      history,
      addToHistory,
      deleteMessage,
      clearHistory,
      reversedHistory,
    }
  },
  {
    electron: {
      persisted: true,
      shared: true,
    },
  },
)
