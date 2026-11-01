/**
 * A factory or callback that produces a value of the declared result type.
 * @typeParam C - The callback result.
 * @example
 * ```ts
 * const factory: Callback<{ ping(): string }> = () => ({ ping: () => 'pong' })
 * ```
 */
export type Callback<C> = () => C

/**
 * A named factory whose own enumerable methods are registered over Electron IPC.
 * @typeParam C - The object produced by the plugin factory.
 * @example
 * ```ts
 * const plugin: Plugin<{ ping(): string }> = ['service', () => ({ ping: () => 'pong' })]
 * ```
 */
export type Plugin<C extends object> = [string, Callback<C>]
