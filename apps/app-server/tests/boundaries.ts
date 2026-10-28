import { vi } from 'vitest'
import childProcess from 'node:child_process'
import net from 'node:net'
import http from 'node:http'
import https from 'node:https'
import { EventEmitter } from 'node:events'
import { Readable } from 'node:stream'
import { writeFileSync } from 'node:fs'

const boundary = vi.hoisted(() => ({
  fetch: vi.fn(),
  get: vi.fn(),
  post: vi.fn(),
  polly: vi.fn(),
  cognito: vi.fn(),
  azure: vi.fn(),
  azureClose: vi.fn(),
  azureConfig: vi.fn(),
  ibmVoices: vi.fn(),
  ibmSynthesize: vi.fn(),
  token: vi.fn(),
  voices: vi.fn(),
  export: vi.fn(),
  ws: [] as any[],
  io: [] as any[],
}))
export const localPorts = new Set<number>()
export const localRequest = http.request.bind(http)
const originalConnect = net.Socket.prototype.connect
const forbidden = () => {
  throw new Error('Unexpected external network/process boundary')
}
function guardedConnect(this: net.Socket, ...args: any[]) {
  const options = Array.isArray(args[0]) ? args[0][0] : args[0]
  if (options?.host === '127.0.0.1' && localPorts.has(Number(options.port)))
    return (originalConnect as any).apply(this, args)
  return forbidden()
}
vi.spyOn(childProcess, 'exec').mockImplementation(forbidden)
vi.spyOn(childProcess, 'spawn').mockImplementation(forbidden)
vi.spyOn(net.Socket.prototype, 'connect').mockImplementation(guardedConnect)
vi.spyOn(http, 'request').mockImplementation(forbidden)
vi.spyOn(https, 'request').mockImplementation(forbidden)
vi.stubGlobal('fetch', forbidden)

vi.mock('axios', () => ({
  default: { get: boundary.get, post: boundary.post },
}))
vi.mock('openai', async (original) => {
  const actual = await original<typeof import('openai')>()
  return {
    ...actual,
    default: class extends actual.default {
      constructor(options: any) {
        super({ ...options, fetch: boundary.fetch, maxRetries: 0 })
      }
    },
  }
})
vi.mock('@elevenlabs/elevenlabs-js', async (original) => {
  const actual = await original<typeof import('@elevenlabs/elevenlabs-js')>()
  return {
    ...actual,
    ElevenLabsClient: class extends actual.ElevenLabsClient {
      constructor(options: any) {
        super({
          ...options,
          fetcher: async (args: any) => {
            const response = await boundary.fetch(args)
            return response
          },
        })
      }
    },
  }
})
vi.mock('@aws-sdk/client-polly', async (original) => {
  const actual = await original<typeof import('@aws-sdk/client-polly')>()
  return {
    ...actual,
    Polly: class {
      constructor(public config: unknown) {}
      send(command: unknown) {
        return boundary.polly(command)
      }
    },
  }
})
vi.mock('@aws-sdk/credential-provider-cognito-identity', () => ({
  fromCognitoIdentityPool: boundary.cognito,
}))
vi.mock('microsoft-cognitiveservices-speech-sdk', async (original) => {
  const actual =
    await original<typeof import('microsoft-cognitiveservices-speech-sdk')>()
  return {
    ...actual,
    SpeechConfig: { fromSubscription: boundary.azureConfig },
    SpeechSynthesizer: class {
      wordBoundary?: (sender: unknown, event: unknown) => void
      constructor(public config: unknown) {}
      speakTextAsync(text: string, success: any, failure: any) {
        boundary.azure(text, success, failure, this, 'text')
      }
      speakSsmlAsync(text: string, success: any, failure: any) {
        boundary.azure(text, success, failure, this, 'ssml')
      }
      close() {
        boundary.azureClose()
      }
    },
  }
})
vi.mock('ibm-watson/text-to-speech/v1', () => ({
  default: class {
    constructor(public config: unknown) {}
    listVoices = boundary.ibmVoices
    synthesize = boundary.ibmSynthesize
  },
}))
vi.mock('ibm-watson/auth', () => ({
  IamAuthenticator: class {
    constructor(public config: unknown) {}
  },
  IamTokenManager: class {
    constructor(public config: unknown) {}
    getToken = boundary.token
  },
}))
vi.mock('say', () => ({
  default: { getInstalledVoices: boundary.voices, export: boundary.export },
}))
vi.mock('ws', () => ({
  default: class extends EventEmitter {
    onopen?: () => void
    onmessage?: (event: any) => void
    onclose?: () => void
    onerror?: () => void
    send = vi.fn()
    close = vi.fn()
    constructor(
      public url: string,
      public options: unknown,
    ) {
      super()
      boundary.ws.push(this)
    }
  },
}))
vi.mock('socket.io', () => ({
  Server: class extends EventEmitter {
    constructor(
      public port: number,
      public options: unknown,
    ) {
      super()
      boundary.io.push(this)
    }
  },
}))
export { boundary }
export function resetBoundaries() {
  vi.spyOn(childProcess, 'exec').mockImplementation(forbidden)
  vi.spyOn(childProcess, 'spawn').mockImplementation(forbidden)
  vi.spyOn(net.Socket.prototype, 'connect').mockImplementation(guardedConnect)
  vi.spyOn(http, 'request').mockImplementation(forbidden)
  vi.spyOn(https, 'request').mockImplementation(forbidden)
  vi.stubGlobal('fetch', forbidden)
  for (const value of Object.values(boundary))
    if (typeof value === 'function') value.mockReset()
  boundary.ws.length = 0
  boundary.io.length = 0
  boundary.cognito.mockReturnValue(async () => ({
    accessKeyId: 'fixture',
    secretAccessKey: 'fixture',
  }))
  boundary.azureConfig.mockImplementation(() => ({
    requestWordLevelTimestamps: vi.fn(),
  }))
  boundary.azure.mockImplementation((_text, success, _failure, instance) => {
    instance.wordBoundary?.(instance, { text: 'hello', audioOffset: 100 })
    success({ audioData: Uint8Array.from([1, 2, 3]).buffer })
  })
  boundary.fetch.mockRejectedValue(new Error('Unexpected SDK transport call'))
  boundary.get.mockRejectedValue(new Error('Unexpected axios GET'))
  boundary.post.mockRejectedValue(new Error('Unexpected axios POST'))
  boundary.polly.mockRejectedValue(new Error('Unexpected Polly request'))
  boundary.voices.mockImplementation((callback) => callback(null, ['fixture']))
  boundary.export.mockImplementation(
    (_text, _voice, _speed, file, callback) => {
      writeFileSync(file, Buffer.from('RIFFfixture'))
      callback(null)
    },
  )
  boundary.ibmVoices.mockResolvedValue({
    result: { voices: [{ name: 'fixture' }] },
  })
  boundary.ibmSynthesize.mockImplementation(async () => ({
    result: Readable.from([Buffer.from('ibm')]),
  }))
  boundary.token.mockResolvedValue('fixture-token')
}
