import server from '..'
import type { Express } from 'express'
const config: { port: number; tempPath: string; ws: { port: number } } =
  server.getConfig()
const app: Express = server.getContext().app
const start: Promise<void> = server.start({
  port: 9000,
  ws: { port: 9001 },
  tempPath: 'temp',
})
const defaults: Promise<void> = server.start({ ws: {} })
const optionalServer = server.server
void [config, app, start, defaults, optionalServer]
// @ts-expect-error listen port is numeric
server.start({ port: '9000' })
// @ts-expect-error nested websocket port is numeric
server.start({ ws: { port: '9001' } })
// @ts-expect-error unsupported configuration option
server.start({ apiKey: 'fixture' })
// @ts-expect-error configuration is structured, not primitive
server.start(9000)
// @ts-expect-error server is asynchronous
const sync: void = server.start()
// @ts-expect-error no stop API is exported
server.stop()
// @ts-expect-error plugin helpers are not package-root runtime exports
import { createMessageReceipt } from '..'
void [sync, createMessageReceipt]
type IsAny<T> = 0 extends 1 & T ? true : false
const typedConfig: IsAny<ReturnType<typeof server.getConfig>> = false
const typedContext: IsAny<ReturnType<typeof server.getContext>> = false
const typedApp: IsAny<ReturnType<typeof server.getContext>['app']> = false
void [typedConfig, typedContext, typedApp]
