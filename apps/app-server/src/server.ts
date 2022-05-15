import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import logger from 'morgan'
import path from 'path'
import { defaultsDeep } from 'lodash'
import { registerGCTTSRoutes } from './routes/gc-tts'
import { registerMATTSRoutes } from './routes/ma-tts'
import { registerIWTTSRoutes } from './routes/iw-tts'
import { registerAPTTSRoutes } from './routes/ap-tts'
import { registerSayTTSRoutes } from './routes/say-tts'

const app = express()
app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
if (process.env.NODE_ENV === 'development') {
  app.use(logger('dev'))
}

class IzabelaServer {
  public server = null
  private config = null
  private defaultConfig = {
    tempPath: path.resolve('temp'),
    port: 7070,
  }

  async startApp() {
    this.server = app.listen(this.getConfig().port, () => {
      const port = this.server.address().port
      console.log('App server now running on port', port)
    })
  }

  async startRouter() {
    const context = { app, server: this.server }
    registerAPTTSRoutes(context)
    registerIWTTSRoutes(context)
    registerGCTTSRoutes(context)
    registerMATTSRoutes(context)
    registerSayTTSRoutes(context)
  }

  async startServer(config = {}) {
    this.config = defaultsDeep(config, this.defaultConfig)
    await this.startRouter()
    await this.startApp()
  }

  getConfig() {
    return this.config || this.defaultConfig
  }
}

const izabelaServer = new IzabelaServer()
export default izabelaServer
