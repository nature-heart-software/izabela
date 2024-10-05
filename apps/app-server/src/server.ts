import express from 'express'
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

class Server {
  public server?: Izabela.Server.Context['server']
  private config?: Izabela.Server.Config
  private defaultConfig: Izabela.Server.Config = {
    tempPath: path.resolve('temp'),
    port: 7070,
    ws: {
      port: 7071,
    },
  }

  async startServer() {
    const server = app.listen(this.getConfig().port, () => {
      const address = server.address()
      console.log(address)
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

  async start(config = {}) {
    this.config = defaultsDeep(config, this.defaultConfig)
    await this.startRouter()
    await this.startServer()
  }

  getContext(): Izabela.Server.Context {
    return { app, server: this.server, config: this.config }
  }

  getConfig(): Izabela.Server.Config {
    return this.config || this.defaultConfig
  }
}

const server = new Server()
export default server
