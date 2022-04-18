var $dqKfY$express = require('express')
var $dqKfY$bodyparser = require('body-parser')
var $dqKfY$cors = require('cors')
var $dqKfY$morgan = require('morgan')
var $dqKfY$path = require('path')
var $dqKfY$lodash = require('lodash')
var $dqKfY$axios = require('axios')
var $dqKfY$uuid = require('uuid')
var $dqKfY$util = require('util')
var $dqKfY$fs = require('fs')

function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a
}

const $3fa2f47ec327b076$export$d3da1ecaf1206c58 = (
  res,
  reason,
  message,
  code,
) => {
  console.log('ERROR: ' + reason, message)
  if (process.env.NODE_ENV === 'production' && code === 500)
    return res.status(500).json({
      error: reason,
    })
  return res.status(code || 500).json({
    error: message,
  })
}

const $294ee9ecf07720ae$export$2272521fb3bd5353 = async (
  { body: { apiKey: apiKey } },
  res,
  next,
) => {
  try {
    const {
      data: { voices: voices },
    } = await $parcel$interopDefault($dqKfY$axios).get(
      `https://texttospeech.googleapis.com/v1beta1/voices?key=${apiKey}`,
    )
    res.status(200).json(voices)
  } catch (e) {
    $3fa2f47ec327b076$export$d3da1ecaf1206c58(
      res,
      'Internal server error',
      e.message,
      500,
    )
  }
}
const $294ee9ecf07720ae$export$720e715da265c262 = async (
  { body: { apiKey: apiKey, ...rest } },
  res,
) => {
  const outputFile = $dqKfY$path.join(
    $b48a6545eca0e91f$export$2e2bcd8739ae039.getConfig().tempPath,
    $dqKfY$uuid.v4() + '.mp3',
  )
  try {
    $dqKfY$fs.mkdirSync(
      $dqKfY$path.parse(outputFile).dir,
      {
        recursive: true,
      },
      (err) => {
        if (err) throw err
      },
    )
    $dqKfY$fs.writeFileSync(outputFile, '')
    const {
      data: { audioContent: audioContent },
    } = await $parcel$interopDefault($dqKfY$axios).post(
      `https://texttospeech.googleapis.com/v1beta1/text:synthesize?key=${apiKey}`,
      rest,
    )
    const writeFile = $dqKfY$util.promisify($dqKfY$fs.writeFile)
    await writeFile(outputFile, Buffer.from(audioContent, 'base64'), 'binary')
    const stat = $dqKfY$fs.statSync(outputFile)
    const total = stat.size
    res.writeHead(200, {
      'Content-Length': total,
      'Content-Type': 'audio/mp3',
    })
    const stream = $dqKfY$fs.createReadStream(outputFile).pipe(res)
    stream.on('finish', () => {
      $dqKfY$fs.unlinkSync(outputFile)
    })
  } catch (e) {
    if ($dqKfY$fs.existsSync(outputFile)) $dqKfY$fs.unlinkSync(outputFile)
    $3fa2f47ec327b076$export$d3da1ecaf1206c58(
      res,
      'Internal server error',
      e.message,
      500,
    )
  }
}

const $7efce5ff8f6cead1$export$776ed06f580210d5 = ({ app: app }) => {
  app.post(
    '/api/tts/google-cloud/list-voices',
    $294ee9ecf07720ae$export$2272521fb3bd5353,
  )
  app.post(
    '/api/tts/google-cloud/synthesize-speech',
    $294ee9ecf07720ae$export$720e715da265c262,
  )
}

const $b48a6545eca0e91f$var$app = $parcel$interopDefault($dqKfY$express)()
$b48a6545eca0e91f$var$app.use($parcel$interopDefault($dqKfY$cors)())
$b48a6545eca0e91f$var$app.use($parcel$interopDefault($dqKfY$bodyparser).json())
$b48a6545eca0e91f$var$app.use(
  $parcel$interopDefault($dqKfY$bodyparser).urlencoded({
    extended: true,
  }),
)
if (process.env.NODE_ENV === 'development')
  $b48a6545eca0e91f$var$app.use($parcel$interopDefault($dqKfY$morgan)('dev'))

class $b48a6545eca0e91f$var$IzabelaServer {
  server = null
  config = null
  defaultConfig = {
    tempPath: $parcel$interopDefault($dqKfY$path).resolve('temp'),
    port: 7070,
  }

  async startApp() {
    this.server = $b48a6545eca0e91f$var$app.listen(
      this.getConfig().port,
      () => {
        const port = this.server.address().port
        console.log('App server now running on port', port)
      },
    )
  }

  async startRouter() {
    const context = {
      app: $b48a6545eca0e91f$var$app,
      server: this.server,
    }
    $7efce5ff8f6cead1$export$776ed06f580210d5(context)
  }

  async startServer(config = {}) {
    this.config = $dqKfY$lodash.defaultsDeep(config, this.defaultConfig)
    await this.startRouter()
    await this.startApp()
  }

  getConfig() {
    return this.config || this.defaultConfig
  }
}

const $b48a6545eca0e91f$var$izabelaServer =
  new $b48a6545eca0e91f$var$IzabelaServer()
var $b48a6545eca0e91f$export$2e2bcd8739ae039 =
  $b48a6545eca0e91f$var$izabelaServer

// if (!module.parent) {
//     izabelaServer.startServer()
// }
module.exports = $b48a6545eca0e91f$export$2e2bcd8739ae039

//# sourceMappingURL=main.js.map
