declare module '@ungap/structured-clone' {
  export type SerializedRecord = [number | string, unknown?]
  export interface CloneOptions {
    json?: boolean
    lossy?: boolean
    transfer?: unknown[]
  }
  function structuredClone<T>(value: T, options?: CloneOptions): T
  export function serialize(
    value: unknown,
    options?: Pick<CloneOptions, 'json' | 'lossy'>,
  ): SerializedRecord[]
  export function deserialize<T = unknown>(records: SerializedRecord[]): T
  export default structuredClone
}

declare module '@ungap/structured-clone/json' {
  export function stringify(value: unknown): string
  export function parse<T = unknown>(text: string): T
}
