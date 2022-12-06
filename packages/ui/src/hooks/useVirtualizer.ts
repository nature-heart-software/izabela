import {
  elementScroll,
  observeElementOffset,
  observeElementRect,
  observeWindowOffset,
  observeWindowRect,
  PartialKeys,
  Virtualizer,
  VirtualizerOptions,
  windowScroll,
} from '@tanstack/virtual-core'
import {
  computed,
  onScopeDispose,
  Ref,
  shallowRef,
  triggerRef,
  unref,
  watch,
} from 'vue'

type MaybeRef<T> = T | Ref<T>

function useVirtualizerBase<
  TScrollElement extends Element | Window,
  TItemElement extends Element,
>(
  options: MaybeRef<VirtualizerOptions<TScrollElement, TItemElement>>,
): Ref<Virtualizer<TScrollElement, TItemElement>> {
  const virtualizer = new Virtualizer(unref(options))
  const state = shallowRef(virtualizer)

  const cleanup = virtualizer._didMount()

  watch(
    () => unref(options).getScrollElement(),
    (el) => {
      if (el) {
        virtualizer._willUpdate()
      }
    },
    {
      immediate: true,
    },
  )

  watch(
    () => unref(options),
    (options) => {
      virtualizer.setOptions({
        ...options,
        onChange: (instance) => {
          triggerRef(state)
          options.onChange?.(instance)
        },
      })

      virtualizer._willUpdate()
    },
    {
      immediate: true,
    },
  )

  onScopeDispose(cleanup)

  return state
}

export function useVirtualizer<
  TScrollElement extends Element,
  TItemElement extends Element,
>(
  options: MaybeRef<
    PartialKeys<
      VirtualizerOptions<TScrollElement, TItemElement>,
      'observeElementRect' | 'observeElementOffset' | 'scrollToFn'
    >
  >,
): Ref<Virtualizer<TScrollElement, TItemElement>> {
  return useVirtualizerBase<TScrollElement, TItemElement>(
    computed(() => ({
      observeElementRect: observeElementRect,
      observeElementOffset: observeElementOffset,
      scrollToFn: elementScroll,
      ...unref(options),
    })),
  )
}

export function useWindowVirtualizer<TItemElement extends Element>(
  options: MaybeRef<
    PartialKeys<
      VirtualizerOptions<Window, TItemElement>,
      | 'observeElementRect'
      | 'observeElementOffset'
      | 'scrollToFn'
      | 'getScrollElement'
    >
  >,
): Ref<Virtualizer<Window, TItemElement>> {
  return useVirtualizerBase<Window, TItemElement>(
    computed(() => ({
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      getScrollElement: () => (typeof Window !== 'undefined' ? window : null!),
      observeElementRect: observeWindowRect,
      observeElementOffset: observeWindowOffset,
      scrollToFn: windowScroll,
      ...unref(options),
    })),
  )
}
