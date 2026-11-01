import express from 'express'
import type { ServerConfig, ServerContext } from './types'
import bodyParser from 'body-parser'
import cors from 'cors'
import logger from 'morgan'
import path from 'path'
import defaultsDeep from 'lodash/defaultsDeep'
import * as plugins from './plugins'
import websocket from './websocket'

const app = express()
app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
if (process.env.NODE_ENV === 'development') {
  app.use(logger('dev'))
}
app.use((_, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Expose-Headers', 'Data')
  next()
})

class Server {
  public server?: ServerContext['server']
  private config?: ServerConfig
  private defaultConfig: ServerConfig = {
    tempPath: path.resolve('temp'),
    port: 7070,
    ws: {
      port: 7071,
    },
  }

  async startServer() {
    const server = app.listen(this.getConfig().port, () => {
      const address = server.address()
      const port =
        address && typeof address !== 'string' && 'port' in address
          ? address.port
          : null
      if (port) {
        console.log('App server now running on port', port)
      } else {
        console.log('App server now running')
      }
      websocket.start({
        port: this.getConfig().ws.port,
      })
    })
    this.server = server
  }

  async startRouter() {
    const context = this.getContext()
    Object.values(plugins).forEach((plugin) => {
      plugin(context)
    })
  }

  async start(
    config: Partial<Omit<ServerConfig, 'ws'>> & {
      ws?: Partial<ServerConfig['ws']>
    } = {},
  ) {
    this.config = defaultsDeep(config, this.defaultConfig)
    await this.startRouter()
    await this.startServer()
  }

  getContext(): ServerContext {
    return { app, server: this.server, config: this.config }
  }

  getConfig(): ServerConfig {
    return this.config || this.defaultConfig
  }
}

const server = new Server()
export default server
