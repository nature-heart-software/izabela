import { computed, shallowRef, unref, watch, type MaybeRef } from 'vue'

const devices = shallowRef<MediaDeviceInfo[]>([])
let consumers = 0
let revision = 0
let pending: Promise<void> | undefined
let refreshQueued = false

const refresh = () => {
  if (!consumers) return
  if (pending) {
    refreshQueued = true
    return
  }
  const current = revision
  pending = navigator.mediaDevices
    .enumerateDevices()
    .then((value) => {
      if (consumers && current === revision) devices.value = value
    })
    .catch((error) => console.warn('Unable to enumerate audio devices', error))
    .finally(() => {
      pending = undefined
      if (refreshQueued && consumers) {
        refreshQueued = false
        refresh()
      }
    })
}

/** Enumerate only for active consumers; share one device-change listener per renderer. */
export const useAudioDevices = (enabled: MaybeRef<boolean> = true) => {
  watch(
    () => unref(enabled),
    (active, _, onCleanup) => {
      if (
        !active ||
        typeof navigator === 'undefined' ||
        !navigator.mediaDevices?.enumerateDevices
      )
        return
      const media = navigator.mediaDevices
      if (++consumers === 1) {
        media.addEventListener('devicechange', refresh)
        refresh()
      }
      onCleanup(() => {
        if (--consumers === 0) {
          revision++
          refreshQueued = false
          media.removeEventListener('devicechange', refresh)
          devices.value = []
        }
      })
    },
    { immediate: true },
  )
  return {
    audioInputs: computed(() =>
      devices.value.filter((d) => d.kind === 'audioinput'),
    ),
    audioOutputs: computed(() =>
      devices.value.filter((d) => d.kind === 'audiooutput'),
    ),
  }
}
