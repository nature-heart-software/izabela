import { nextTick, watch, type Ref, type WatchSource } from 'vue'

// The shield's click owns dismissal. A deferred outside-pointer event can still
// reference that shield after a nested overlay has removed it from the DOM.
export function onOverlayShieldInteractOutside(event: CustomEvent) {
  const target = event.detail?.originalEvent?.target
  if (
    target instanceof HTMLElement &&
    target.closest('[data-overlay-shield], [data-nv-overlay-shield]')
  )
    event.preventDefault()
}

// Keep a nested shield inside its focus layer while cancelling the fixed
// containing block created by an ancestor positioner's transform.
export function useViewportShield(
  visible: WatchSource<boolean>,
  shieldElement: Ref<HTMLElement | undefined>,
  portalTarget: WatchSource<unknown>,
  offset: Ref<{ x: number; y: number }>,
) {
  watch(
    [visible, shieldElement, portalTarget] as const,
    async ([open, element], _, onCleanup) => {
      if (!open || !element) return
      let cancelled = false
      let observer: MutationObserver | undefined
      const update = () => {
        const rect = element.getBoundingClientRect()
        const { x, y } = offset.value
        if (rect.left !== 0 || rect.top !== 0)
          offset.value = { x: x - rect.left, y: y - rect.top }
      }
      onCleanup(() => {
        cancelled = true
        observer?.disconnect()
        window.removeEventListener('resize', update)
        window.removeEventListener('scroll', update, true)
      })
      // Nested teleports can move after the child's post-flush watcher.
      await nextTick()
      if (cancelled) return
      observer = new MutationObserver(update)
      for (
        let parent = element.parentElement;
        parent;
        parent = parent.parentElement
      )
        observer.observe(parent, {
          attributes: true,
          attributeFilter: ['style', 'class'],
        })
      window.addEventListener('resize', update)
      window.addEventListener('scroll', update, true)
      update()
    },
    { flush: 'post' },
  )
}
