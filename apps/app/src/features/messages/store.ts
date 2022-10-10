// eslint-disable-next-line import/no-cycle
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { IzabelaHistoryMessage, IzabelaMessagePayload } from '@/modules/izabela/types'
import { ShortcutMessage } from '@/features/messages/types'

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
    const shortcutMessages = ref<ShortcutMessage[]>([])
    const addShortcutMessage = (message: ShortcutMessage) => {
      shortcutMessages.value.unshift(message)
    }
    const updateShortcutMessage = (id: string, payload: Partial<ShortcutMessage>) => {
      const message = shortcutMessages.value.find((m) => m.id === id)
      if (message) {
        Object.assign(message, payload)
      }
    }
    const removeShortcutMessage = (id: ShortcutMessage['id']) => {
      shortcutMessages.value = shortcutMessages.value.filter((m) => m.id !== id)
    }
    const history = ref<IzabelaHistoryMessage[]>([])
    const addToHistory = (
      id: string,
      { engine, payload, message, voice }: IzabelaMessagePayload,
    ) => {
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
    }

    const removeHistoryMessage = (id: string) => {
      history.value = history.value.filter((message) => message.id !== id)
    }

    const clearHistory = () => {
      history.value = []
    }

    const reversedHistory = computed(() => history.value.slice().reverse())
    return {
      history,
      addToHistory,
      removeHistoryMessage,
      clearHistory,
      reversedHistory,
      shortcutMessages,
      addShortcutMessage,
      updateShortcutMessage,
      removeShortcutMessage,
    }
  },
  {
    electron: {
      persisted: true,
      shared: true,
    },
  },
)
