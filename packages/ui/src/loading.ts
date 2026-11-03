import type { App, Directive } from 'vue'
import { cva } from '@/styled-system/css'

const targetRecipe = cva({ base: { position: 'relative' } })
const maskRecipe = cva({
  base: {
    // The mask must cover its host without replacing native control semantics.
    position: 'absolute',
    inset: '0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'loading.default.pending.background',
    color: 'loading.default.pending.foreground',
    cursor: 'progress',
    zIndex: '1',
    borderRadius: 'inherit',
  },
})
const spinnerRecipe = cva({
  base: {
    width: '1rem',
    height: '1rem',
    border: '2px solid currentColor',
    borderTopColor: 'transparent',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    color: 'loading.default.pending.spinner',
    _motionReduce: { animation: 'none' },
  },
})
const states = new WeakMap<
  HTMLElement,
  { mask: HTMLElement; previousBusy: string | null; addedClass: boolean }
>()
function clear(element: HTMLElement) {
  const state = states.get(element)
  if (!state) return
  state.mask.remove()
  if (state.previousBusy === null) element.removeAttribute('aria-busy')
  else element.setAttribute('aria-busy', state.previousBusy)
  if (state.addedClass) element.classList.remove(...targetRecipe().split(' '))
  states.delete(element)
}
function update(element: HTMLElement, busy: unknown) {
  if (!busy) {
    clear(element)
    return
  }
  if (states.has(element)) return
  const mask = document.createElement('span')
  mask.className = `${maskRecipe()} nv-loading-mask`
  mask.setAttribute('role', 'status')
  mask.setAttribute(
    'aria-label',
    element.getAttribute('data-loading-label') || 'Loading',
  )
  const spinner = document.createElement('span')
  spinner.className = spinnerRecipe()
  spinner.setAttribute('aria-hidden', 'true')
  mask.append(spinner)
  const classes = targetRecipe().split(' ')
  const addedClass = !classes.every((name) => element.classList.contains(name))
  states.set(element, {
    mask,
    addedClass,
    previousBusy: element.getAttribute('aria-busy'),
  })
  element.classList.add(...classes)
  element.setAttribute('aria-busy', 'true')
  element.append(mask)
}

/**
 * Displays a loading status over a host while retaining its native behavior.
 * @example
 * ```ts
 * app.directive('loading', loadingDirective)
 * ```
 */
export const loadingDirective: Directive<HTMLElement, boolean> = {
  mounted: (element, binding) => update(element, binding.value),
  updated: (element, binding) => update(element, binding.value),
  beforeUnmount: clear,
}

/**
 * Installs the shared v-loading directive without a UI framework dependency.
 * @example
 * ```ts
 * createApp(App).use(NvLoading)
 * ```
 */
export const NvLoading = {
  install(app: App) {
    app.directive('loading', loadingDirective)
  },
}
