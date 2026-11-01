import { Express } from 'express'

/** Server configuration after defaults are applied. */
export type ServerConfig = Izabela.Server.Config
/** Application, listener, and configuration passed to server plugins. */
export type ServerContext = Izabela.Server.Context

declare global {
  namespace Izabela {
    namespace Server {
      type Config = {
        tempPath: string
        port: number
        ws: {
          port: number
        }
      }
      type Context = {
        app: Express
        server?: ReturnType<Express['listen']>
        config?: Config
      }
      type Plugin = (context: Context) => void
    }
  }
}
