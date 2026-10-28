import { Bridge, bridge, isRenderer } from '..'
import type { Callback, Plugin } from '..'

interface Calculator {
  add(a: number, b: number): number
  label: string
}
const factory: Callback<Calculator> = () => ({
  add: (a, b) => a + b,
  label: 'calculator',
})
const plugin: Plugin<Calculator> = ['calculator', factory]
const local = Bridge()
const result: void = local.register([plugin])
bridge.register([
  ['sync', () => ({ ping: () => 'pong' })],
  ['async', () => ({ read: async () => 42 })],
])
const renderer: boolean = isRenderer
const standalone: Callback<number> = () => 3
// @ts-expect-error a plugin factory must return an object, not a number
bridge.register([['invalid', () => 3]])
// @ts-expect-error the plugin name must be a string
bridge.register([[1, factory]])
// @ts-expect-error a plugin tuple requires a factory
bridge.register([['missing']])
const wrong: Plugin<Calculator> = [
  'calculator',
  // @ts-expect-error plugin result contracts must match the factory
  () => ({ label: 'missing add' }),
]
void [result, renderer, standalone]
