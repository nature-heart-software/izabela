import { VNode, Comment } from 'vue'

export function isVNodeEmpty(vnodes: VNode | VNode[] | undefined | null): boolean {
  return (
    !!vnodes &&
    (Array.isArray(vnodes)
      ? vnodes.every((vnode) => vnode.type === Comment || !vnode.children)
      : vnodes.type === Comment || !vnodes.children)
  )
}
