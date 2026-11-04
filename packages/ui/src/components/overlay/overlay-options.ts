import type { ComputePositionConfig } from '@floating-ui/vue'

/** Options interpreted by the shared Ark tooltip and context-menu controls. */
export interface OverlayOptions {
  placement?:
    | ComputePositionConfig['placement']
    | 'auto'
    | 'auto-start'
    | 'auto-end'
  offset?: [number, number]
  delay?: number | [number | null, number | null]
  duration?: number | [number | null, number | null]
  animation?: string | boolean
  interactive?: boolean
  /** Other legacy options remain accepted but do not configure the Ark controls. */
  [option: string]: unknown
}
