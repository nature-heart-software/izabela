import type { AppBridgeModules, BridgeMethods } from './bridge-contract'

type Equal<Left, Right> = (<T>() => T extends Left ? 1 : 2) extends <
  T,
>() => T extends Right ? 1 : 2
  ? true
  : false
type Assert<Value extends true> = Value

export type WindowTypesAreUnchanged = Assert<
  {
    [Name in keyof AppBridgeModules]: Equal<
      Window[Name],
      AppBridgeModules[Name]
    >
  }[keyof AppBridgeModules] extends true
    ? true
    : false
>

type Example = BridgeMethods<{
  Example: {
    first(value: string): Promise<number>
    second(): void
    version: number
  }
}>
export const complete: Example = { Example: { first: true, second: true } }
// @ts-expect-error Every callable key is required, not just a subset.
export const missing: Example = { Example: { first: true } }
export const extra: Example = {
  // @ts-expect-error Unknown method names must not become exposed channels.
  Example: { first: true, second: true, typo: true },
}
export const nonCallable: Example = {
  // @ts-expect-error Non-callable properties are not IPC methods.
  Example: { first: true, second: true, version: true },
}
