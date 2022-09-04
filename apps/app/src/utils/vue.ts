import { VNode, Comment } from 'vue'

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
