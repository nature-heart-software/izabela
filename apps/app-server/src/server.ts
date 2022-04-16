import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import logger from 'morgan'
import { registerGCTTSRoutes } from './routes/gc-tts'
import path from 'path'
import { defaultsDeep } from 'lodash'

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
    tempPath: '',
  }

  async startApp() {
    this.server = app.listen(process.env.PORT || 8080, () => {
      const port = this.server.address().port
      console.log('App server now running on port', port)
    })
  }

  async startRouter() {
    const context = { app, server: this.server }
    registerGCTTSRoutes(context)
  }

  async startServer(config = {}) {
    this.config = defaultsDeep(config, this.defaultConfig)
    await this.startRouter()
    await this.startApp()
  }

  getTempPath() {
    return this.config?.tempPath || path.resolve('temp')
  }
}

const izabelaServer = new IzabelaServer()
export default izabelaServer
