import { Comment, VNode, unref } from 'vue'

export function isVNodeEmpty(
  slot: (d: object) => VNode | VNode[] | undefined | null,
  data = {},
): boolean {
  if (!slot) return true
  const vnodes: VNode | VNode[] | undefined | null = slot(data)
  return (
    !!vnodes &&
    (Array.isArray(vnodes)
      ? vnodes.every((vnode) => vnode.type === Comment || !vnode.children)
      : vnodes.type === Comment || !vnodes.children)
  )
}

export function getElement(value: any): HTMLElement | null {
  if (!value) return null
  const unwrapped = unref(value)
  if (unwrapped instanceof HTMLElement) return unwrapped
  if (unwrapped?.$el instanceof HTMLElement) return unwrapped.$el
  if (typeof unwrapped === 'string') return document.querySelector(unwrapped)
  return null
}
