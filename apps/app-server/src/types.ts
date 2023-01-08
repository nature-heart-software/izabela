import { Express } from 'express'

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
