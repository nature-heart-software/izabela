export type Callback<C extends any> = () => C
export type Plugin<C extends Callback<C>> = [string, Callback<C>]
