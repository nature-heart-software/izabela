var $bQw3L$express = require('express')
var $bQw3L$bodyparser = require('body-parser')
var $bQw3L$cors = require('cors')
var $bQw3L$morgan = require('morgan')
var $bQw3L$path = require('path')
var $bQw3L$lodash = require('lodash')
var $bQw3L$axios = require('axios')
var $bQw3L$uuid = require('uuid')
var $bQw3L$buffer = require('buffer')
var $bQw3L$util = require('util')
var $bQw3L$fs = require('fs')

function $parcel$defineInteropFlag(a) {
  Object.defineProperty(a, '__esModule', { value: true, configurable: true })
}
function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {
    get: v,
    set: s,
    enumerable: true,
    configurable: true,
  })
}
function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a
}
var $parcel$global =
  typeof globalThis !== 'undefined'
    ? globalThis
    : typeof self !== 'undefined'
    ? self
    : typeof window !== 'undefined'
    ? window
    : typeof global !== 'undefined'
    ? global
    : {}
var $parcel$modules = {}
var $parcel$inits = {}

var parcelRequire = $parcel$global['parcelRequire6577']
if (parcelRequire == null) {
  parcelRequire = function (id) {
    if (id in $parcel$modules) {
      return $parcel$modules[id].exports
    }
    if (id in $parcel$inits) {
      var init = $parcel$inits[id]
      delete $parcel$inits[id]
      var module = { id: id, exports: {} }
      $parcel$modules[id] = module
      init.call(module.exports, module, module.exports)
      return module.exports
    }
    var err = new Error("Cannot find module '" + id + "'")
    err.code = 'MODULE_NOT_FOUND'
    throw err
  }

  parcelRequire.register = function register(id, init) {
    $parcel$inits[id] = init
  }

  $parcel$global['parcelRequire6577'] = parcelRequire
}
parcelRequire.register('9JO8z', function (module, exports) {
  $parcel$defineInteropFlag(module.exports)

  $parcel$export(
    module.exports,
    'default',
    () => $4b54371958711930$export$2e2bcd8739ae039,
    (v) => ($4b54371958711930$export$2e2bcd8739ae039 = v),
  )

  var $kRHR0 = parcelRequire('kRHR0')
  var $4b54371958711930$export$2e2bcd8739ae039 = $kRHR0.default
  if (undefined !== module) $kRHR0.default.startServer()
})
parcelRequire.register('kRHR0', function (module, exports) {
  $parcel$export(
    module.exports,
    'default',
    () => $92e82dbf15e3fc14$export$2e2bcd8739ae039,
  )

  var $entDz = parcelRequire('entDz')

  const $92e82dbf15e3fc14$var$app = $parcel$interopDefault($bQw3L$express)()
  $92e82dbf15e3fc14$var$app.use($parcel$interopDefault($bQw3L$cors)())
  $92e82dbf15e3fc14$var$app.use(
    $parcel$interopDefault($bQw3L$bodyparser).json(),
  )
  $92e82dbf15e3fc14$var$app.use(
    $parcel$interopDefault($bQw3L$bodyparser).urlencoded({
      extended: true,
    }),
  )
  $92e82dbf15e3fc14$var$app.use($parcel$interopDefault($bQw3L$morgan)('dev'))
  class $92e82dbf15e3fc14$var$IzabelaServer {
    server = null
    config = null
    defaultConfig = {
      tempPath: '',
    }
    async startApp() {
      this.server = $92e82dbf15e3fc14$var$app.listen(8080, () => {
        const port = this.server.address().port
        console.log('App server now running on port', port)
      })
    }
    async startRouter() {
      const context = {
        app: $92e82dbf15e3fc14$var$app,
        server: this.server,
      }
      $entDz.registerGCTTSRoutes(context)
    }
    async startServer(config = {}) {
      this.config = $bQw3L$lodash.defaultsDeep(config, this.defaultConfig)
      await this.startRouter()
      await this.startApp()
    }
    getTempPath() {
      return (
        this.config?.tempPath ||
        $parcel$interopDefault($bQw3L$path).resolve('temp')
      )
    }
  }
  const $92e82dbf15e3fc14$var$izabelaServer =
    new $92e82dbf15e3fc14$var$IzabelaServer()
  var $92e82dbf15e3fc14$export$2e2bcd8739ae039 =
    $92e82dbf15e3fc14$var$izabelaServer
})
parcelRequire.register('entDz', function (module, exports) {
  $parcel$export(
    module.exports,
    'registerGCTTSRoutes',
    () => $d7f6f10a22a9fcf4$export$776ed06f580210d5,
  )

  var $k1NAd = parcelRequire('k1NAd')
  const $d7f6f10a22a9fcf4$export$776ed06f580210d5 = ({ app: app }) => {
    app.post('/api/gc-tts/list-voices', $k1NAd.listVoicesHandler)
    app.post('/api/gc-tts/synthesize-speech', $k1NAd.synthesizeSpeechHandler)
  }
})
parcelRequire.register('k1NAd', function (module, exports) {
  $parcel$export(
    module.exports,
    'listVoicesHandler',
    () => $8cf388cc11f3f529$export$2272521fb3bd5353,
  )
  $parcel$export(
    module.exports,
    'synthesizeSpeechHandler',
    () => $8cf388cc11f3f529$export$720e715da265c262,
  )

  var $gDEap = parcelRequire('gDEap')

  var $kRHR0 = parcelRequire('kRHR0')

  var $8cf388cc11f3f529$require$Buffer = $bQw3L$buffer.Buffer

  const $8cf388cc11f3f529$export$2272521fb3bd5353 = async (
    { body: { apiKey: apiKey } },
    res,
    next,
  ) => {
    try {
      const {
        data: { voices: voices },
      } = await $parcel$interopDefault($bQw3L$axios).get(
        `https://texttospeech.googleapis.com/v1beta1/voices?key=${apiKey}`,
      )
      res.status(200).json(voices)
    } catch (e) {
      $gDEap.handleError(res, 'Internal server error', e.message, 500)
    }
  }
  const $8cf388cc11f3f529$export$720e715da265c262 = async (
    { body: { apiKey: apiKey, ...rest } },
    res,
  ) => {
    const outputFile = $bQw3L$path.join(
      $kRHR0.default.getTempPath(),
      $bQw3L$uuid.v4() + '.mp3',
    )
    try {
      $bQw3L$fs.mkdirSync(
        $bQw3L$path.parse(outputFile).dir,
        {
          recursive: true,
        },
        (err) => {
          if (err) throw err
        },
      )
      $bQw3L$fs.writeFileSync(outputFile, '')
      const {
        data: { audioContent: audioContent },
      } = await $parcel$interopDefault($bQw3L$axios).post(
        `https://texttospeech.googleapis.com/v1beta1/text:synthesize?key=${apiKey}`,
        rest,
      )
      const writeFile = $bQw3L$util.promisify($bQw3L$fs.writeFile)
      await writeFile(
        outputFile,
        $8cf388cc11f3f529$require$Buffer.from(audioContent, 'base64'),
        'binary',
      )
      const stat = $bQw3L$fs.statSync(outputFile)
      const total = stat.size
      res.writeHead(200, {
        'Content-Length': total,
        'Content-Type': 'audio/mp3',
      })
      const stream = $bQw3L$fs.createReadStream(outputFile).pipe(res)
      stream.on('finish', () => {
        $bQw3L$fs.unlinkSync(outputFile)
      })
    } catch (e) {
      if ($bQw3L$fs.existsSync(outputFile)) $bQw3L$fs.unlinkSync(outputFile)
      $gDEap.handleError(res, 'Internal server error', e.message, 500)
    }
  }
})
parcelRequire.register('gDEap', function (module, exports) {
  $parcel$export(
    module.exports,
    'handleError',
    () => $759500ea72a9a853$export$d3da1ecaf1206c58,
  )
  const $759500ea72a9a853$export$d3da1ecaf1206c58 = (
    res,
    reason,
    message,
    code,
  ) => {
    console.log('ERROR: ' + reason, message)
    return res.status(code || 500).json({
      error: message,
    })
  }
})

parcelRequire('9JO8z')

//# sourceMappingURL=main.js.map
