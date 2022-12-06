import { MaybeRef } from '@vueuse/core'
import { computed, ref, unref, watch } from 'vue'
import { purify } from '@packages/toolbox'
import { IzabelaMessage } from '@/modules/izabela/types'
import { emitIPCSay } from '@/electron/events/renderer'
import { usePlayingMessageStore } from '@/features/messages/store'

export const usePlayMessage = (message: MaybeRef<IzabelaMessage>) => {
  const playingMessageStore = usePlayingMessageStore()
  const isLoading = ref(false)
  const play = () => {
    isLoading.value = true
    const payload = purify(unref(message))
    emitIPCSay(payload)
  }
  const isPlaying = computed(
    () => playingMessageStore.id === unref(message).id && playingMessageStore.progress < 1,
  )
  const progress = computed(() => (isPlaying.value ? playingMessageStore.progress : 0))
  watch(
    () => playingMessageStore.progress,
    () => {
      if (playingMessageStore.id === unref(message).id) {
        isLoading.value = false
      }
    },
  )
  return {
    play,
    isLoading,
    isPlaying,
    progress,
  }
}
