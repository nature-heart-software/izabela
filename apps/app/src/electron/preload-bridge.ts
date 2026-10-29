import { bridge } from '@packages/electron-bridger'
import { bridgeContract } from './bridge-contract'

export const bridgePreloadModules = () =>
  bridge.register(
    Object.entries(bridgeContract).map(([name, methods]) => [
      name,
      // electron-bridger only enumerates these functions in the preload;
      // its existing proxies own channel naming and invocation forwarding.
      () =>
        Object.fromEntries(Object.keys(methods).map((key) => [key, () => {}])),
    ]),
  )
