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
    backgroundColor:
      'color-mix(in srgb, var(--nv-disabled-item-background-backdrop-color) calc(var(--nv-disabled-item-background-backdrop-opacity) * 100%), transparent)',
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
    color: 'var(--nv-text-color)',
    _motionReduce: { animation: 'none' },
  },
})
const states = new WeakMap<
  HTMLElement,
  {
    mask: HTMLElement
    previousBusy: string | null
    addedClass: boolean
    cleanup: () => void
  }
>()

function alignMask(element: HTMLElement, mask: HTMLElement) {
  const selector = element.getAttribute('data-nv-loading-target')
  const surface = selector
    ? element.querySelector<HTMLElement>(selector) || element
    : element
  const update = () => {
    const style = getComputedStyle(surface)
    const border = {
      top: parseFloat(style.borderTopWidth) || 0,
      right: parseFloat(style.borderRightWidth) || 0,
      bottom: parseFloat(style.borderBottomWidth) || 0,
      left: parseFloat(style.borderLeftWidth) || 0,
    }
    const rect = surface.getBoundingClientRect()
    if (surface !== element) {
      const host = element.getBoundingClientRect()
      const hostStyle = getComputedStyle(element)
      // Absolute positioning starts at the host's padding edge. Keep the mask
      // on its original host so it retains the same click/keyboard behavior.
      mask.style.top = `${
        rect.top +
        border.top -
        host.top -
        (parseFloat(hostStyle.borderTopWidth) || 0)
      }px`
      mask.style.right = `${
        host.right -
        (parseFloat(hostStyle.borderRightWidth) || 0) -
        rect.right +
        border.right
      }px`
      mask.style.bottom = `${
        host.bottom -
        (parseFloat(hostStyle.borderBottomWidth) || 0) -
        rect.bottom +
        border.bottom
      }px`
      mask.style.left = `${
        rect.left +
        border.left -
        host.left -
        (parseFloat(hostStyle.borderLeftWidth) || 0)
      }px`
    }
    for (const [corner, horizontal, vertical] of [
      ['TopLeft', border.left, border.top],
      ['TopRight', border.right, border.top],
      ['BottomRight', border.right, border.bottom],
      ['BottomLeft', border.left, border.bottom],
    ] as const) {
      const [x, y = x] = style[`border${corner}Radius`].split(' ')
      const resolve = (value: string, size: number) =>
        (parseFloat(value) || 0) * (value.endsWith('%') ? size / 100 : 1)
      mask.style[`border${corner}Radius`] = `${Math.max(
        0,
        resolve(x, rect.width) - horizontal,
      )}px ${Math.max(0, resolve(y, rect.height) - vertical)}px`
    }
  }
  update()
  const observer =
    typeof ResizeObserver === 'undefined'
      ? undefined
      : new ResizeObserver(update)
  observer?.observe(element)
  if (surface !== element) observer?.observe(surface)
  return () => observer?.disconnect()
}

function clear(element: HTMLElement) {
  const state = states.get(element)
  if (!state) return
  state.cleanup()
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
    cleanup: () => {},
  })
  element.classList.add(...classes)
  element.setAttribute('aria-busy', 'true')
  element.append(mask)
  states.get(element)!.cleanup = alignMask(element, mask)
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
