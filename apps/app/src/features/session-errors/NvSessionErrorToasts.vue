<template>
  <Teleport v-if="portal" :to="portal">
    <div
      ref="floating"
      :style="floatingStyles"
      :class="[
        hitboxClass,
        box({ width: '384px', maxWidth: 'calc(100vw - 24px)', zIndex: '9999' }),
      ]"
      data-session-error-toasts
    >
      <!-- Ark owns timing/announcements; natural flow lets positioning measure the whole stack, not just its first toast. -->
      <Toaster
        :toaster="toaster"
        :style="{
          position: 'relative',
          inset: 'auto',
          width: '100%',
          gap: `${tokens.spacing['3']}px`,
        }"
      >
        <template #default="toast">
          <Toast.Root
            :class="css({ '&[data-state=closed]': { display: 'none' } })"
            :style="{
              position: 'relative',
              inset: 'auto',
              transform: 'none',
              width: '100%',
            }"
          >
            <NvAlert type="error" size="sm">
              <span :class="hstack({ alignItems: 'start', gap: '3' })">
                <span
                  :class="vstack({ alignItems: 'start', gap: '1', flex: '1' })"
                >
                  <Toast.Title as-child
                    ><NvText>{{ toast.title }}</NvText></Toast.Title
                  >
                  <Toast.Description as-child
                    ><NvText>{{ toast.description }}</NvText></Toast.Description
                  >
                </span>
                <Toast.CloseTrigger as-child
                  ><NvButton
                    icon-name="times"
                    type="plain"
                    size="sm"
                    aria-label="Dismiss notification"
                /></Toast.CloseTrigger>
              </span>
            </NvAlert>
          </Toast.Root>
        </template>
      </Toaster>
    </div>
  </Teleport>
</template>
<script setup lang="ts">
import {
  computed,
  inject,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  type Ref,
} from 'vue'
import { Toast, Toaster, createToaster } from '@ark-ui/vue'
import { useFloating, autoUpdate, flip, offset, shift } from '@floating-ui/vue'
import { NvAlert, NvButton, NvText, tokens } from '@packages/ui'
import { css } from '@/styled-system/css'
import { box, hstack, vstack } from '@/styled-system/patterns'
import { hitboxClass } from '@/modules/vue-hitboxes'
import { useSessionErrorsStore } from './store'
const props = defineProps<{ anchor?: HTMLElement }>()
const portal = inject<Ref<HTMLElement | undefined>>('router-overlay')
const store = useSessionErrorsStore()
const floating = ref<HTMLElement>()
const anchor = computed(() => props.anchor)
const hasToasts = ref(false)
const activeToasts = new Set<string>()
const toaster = createToaster({
  placement: 'top-start',
  max: 3,
  overlap: false,
  gap: tokens.spacing['3'],
})

const { x, y, strategy, isPositioned } = useFloating(anchor, floating, {
  placement: 'top-start',
  strategy: 'fixed',
  middleware: [
    offset(tokens.spacing['3']),
    flip({ fallbackPlacements: ['bottom-start'] }),
    shift({ padding: tokens.spacing['3'] }),
  ],
  whileElementsMounted(reference, floating, update) {
    let cleanup: (() => void) | undefined
    const stop = watch(
      hasToasts,
      (active) => {
        cleanup?.()
        cleanup = active
          ? autoUpdate(reference, floating, update, { animationFrame: true })
          : undefined
      },
      { immediate: true, flush: 'sync' },
    )
    return () => {
      stop()
      cleanup?.()
    }
  },
})
const floatingStyles = computed(() => ({
  position: strategy.value,
  left: `${x.value || 0}px`,
  top: `${y.value || 0}px`,
  visibility: isPositioned.value ? ('visible' as const) : ('hidden' as const),
}))
const seen = new Set(store.entries.map((error) => error.id))
const titles = {
  connection: 'Connection error',
  subscription: 'Subscription error',
  other: 'Provider error',
}
const descriptions = {
  connection: 'Could not connect. Check your connection and try again.',
  subscription:
    'Check your provider subscription, billing or available credits.',
  other:
    'The provider could not complete this operation. Check its settings and try again.',
}
const operations = {
  speech: 'Speech',
  'speech-recognition': 'Speech recognition',
  translation: 'Translation',
  provider: 'Provider',
}
watch(
  () => store.entries,
  (entries) => {
    if (!entries.length) {
      toaster.remove()
      activeToasts.clear()
      hasToasts.value = false
    }
    for (const error of entries) {
      if (seen.has(error.id)) continue
      seen.add(error.id)
      // Keep new failures visible during a burst without discarding session history.
      if (toaster.getCount() >= 3) {
        const oldest = toaster.getToastsByPlacement('top-start').at(-1)
        if (oldest) {
          toaster.remove(oldest.id)
          activeToasts.delete(oldest.id)
        }
      }
      toaster.create({
        id: `session-error-${error.id}`,
        type: 'error',
        title: titles[error.category],
        description: `${operations[error.operation]}${
          error.provider ? ` · ${error.provider}` : ''
        }: ${descriptions[error.category]}`,
        duration: 8000,
        onStatusChange({ status }) {
          if (status === 'visible')
            activeToasts.add(`session-error-${error.id}`)
          else activeToasts.delete(`session-error-${error.id}`)
          hasToasts.value = activeToasts.size > 0
        },
      })
    }
  },
  { flush: 'sync' },
)
let disposed = false
onMounted(async () => {
  await store.$whenReady()
  const snapshot = await window.ElectronSessionErrors.read()
  if (disposed) return
  // A renderer reload restores history, not expired notifications. Never overwrite a newer live update.
  snapshot.entries.forEach((error) => seen.add(error.id))
  if (snapshot.revision >= store.revision) {
    // Hydration is local: $patch is a shared IPC write and could roll main back.
    store.entries = snapshot.entries
    store.hasOccurred = snapshot.hasOccurred
    store.revision = snapshot.revision
  }
})
onBeforeUnmount(() => {
  disposed = true
  toaster.remove()
})
</script>
