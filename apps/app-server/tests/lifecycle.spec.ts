import { boundary, resetBoundaries } from './boundaries'
import { request } from './http'
import { EventEmitter } from 'node:events'
import { PassThrough } from 'node:stream'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import server from '../src/main'
import websocket from '../src/websocket'
import { handleError } from '../src/utils/requests'
import { createMessageReceipt } from '../src/utils/message'
import el from '../src/plugins/speech-apis/el'
import iw from '../src/plugins/speech-apis/iw'
import { harness } from './http'
import { tmpdir } from 'node:os'

beforeEach(() => {
  resetBoundaries()
  vi.spyOn(console, 'log').mockImplementation(() => {})
})
afterEach(() => {
  vi.unstubAllEnvs()
  vi.useRealTimers()
})

describe('entrypoint, server configuration, actual middleware', () => {
  it('exports the real server without listening on ordinary import', () => {
    expect(server.server).toBeUndefined()
    expect(server.getConfig()).toEqual({
      tempPath: expect.any(String),
      port: 7070,
      ws: { port: 7071 },
    })
    expect(server.getContext().app).toBeTypeOf('function')
    expect(boundary.io).toHaveLength(0)
  })
  it('merges nested defaults, installs all providers, then listens and starts websocket on callback', async () => {
    const { app } = server.getContext()
    const httpServer = { address: () => ({ port: 8181 }) }
    let callback: (() => void) | undefined
    const listen = vi.spyOn(app, 'listen').mockImplementation(((
      port: number,
      cb: () => void,
    ) => {
      expect(port).toBe(8181)
      callback = cb
      return httpServer
    }) as any)
    const config = { port: 8181, ws: {} }
    await server.start(config)
    expect(server.getConfig()).toEqual({
      port: 8181,
      ws: { port: 7071 },
      tempPath: expect.any(String),
    })
    expect(server.getContext().server).toBe(httpServer)
    expect(listen).toHaveBeenCalledOnce()
    expect(boundary.io).toHaveLength(0)
    callback!()
    expect(boundary.io[0]).toMatchObject({
      port: 7071,
      options: { cors: { origin: '*', methods: ['*'] } },
    })
    expect(console.log).toHaveBeenCalledWith(
      'App server now running on port',
      8181,
    )
  })
  it('uses real server CORS/JSON middleware and dispatches installed OpenAI models route', async () => {
    await server.startRouter()
    const { app } = server.getContext()
    const response = await request(app, '/api/tts/openai/list-models')
    expect(response.status).toBe(200)
    expect(response.json()).toContain('tts-1')
    expect(response.headers['access-control-allow-origin']).toBe('*')
    expect(response.headers['access-control-expose-headers']).toBe('Data')
  })
})

describe('websocket connection ownership and forwarding', () => {
  function socket(id: string) {
    const incoming = new EventEmitter()
    return { id, on: incoming.on.bind(incoming), emit: vi.fn(), incoming }
  }
  it('forwards say only to peers, broadcasts documented events, and removes disconnected clients', () => {
    websocket.start({ port: 9999 })
    const io = boundary.io[0]
    const one = socket('one')
    const two = socket('two')
    const three = socket('three')
    io.emit('connect', one)
    io.emit('connect', two)
    io.emit('connect', three)
    const broadcast = vi.spyOn(io, 'emit')
    const message = { text: 'hello ü' }
    one.incoming.emit('say', message)
    expect(one.emit).not.toHaveBeenCalled()
    expect(two.emit).toHaveBeenCalledWith('say', message)
    expect(three.emit).toHaveBeenCalledWith('say', message)
    two.incoming.emit('disconnect')
    two.emit.mockClear()
    one.incoming.emit('say', 'second')
    expect(two.emit).not.toHaveBeenCalled()
    const events = [
      'audio:play',
      'message:load',
      'message:start',
      'message:end',
      'message:error',
      'message:response:data',
      'message:timeupdate',
      'window:focus',
      'window:blur',
      'input:focus',
      'input:blur',
      'speech:recording:start',
      'speech:recording:end',
      'speech:recording:data:start',
      'speech:recording:data:chunk',
      'speech:recording:data:end',
    ]
    for (const event of events) {
      one.incoming.emit(event, message)
      expect(broadcast).toHaveBeenLastCalledWith(event, message)
    }
    three.incoming.emit('disconnect')
    one.incoming.emit('disconnect')
  })
})

describe('message receipt and error helper', () => {
  it('generates distinct UUIDs and ISO timestamps without changing text', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-02T03:04:05.000Z'))
    const first = createMessageReceipt(' hello ü ')
    const second = createMessageReceipt('')
    expect(first).toEqual({
      text: ' hello ü ',
      id: expect.stringMatching(
        /^[a-f\d]{8}-[a-f\d]{4}-4[a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}$/i,
      ),
      timestamp: '2026-01-02T03:04:05.000Z',
    })
    expect(second.id).not.toBe(first.id)
    expect(second.text).toBe('')
  })
  it.each([
    ['production', 500, 'reason'],
    ['development', 500, 'fixture-detail'],
    ['production', 400, 'fixture-detail'],
    ['production', 0, 'fixture-detail'],
  ])('error response in %s code %s', (env, code, error) => {
    vi.stubEnv('NODE_ENV', env)
    const response = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnValue('sent'),
    }
    expect(
      handleError(response as any, 'reason', 'fixture-detail', code as number),
    ).toBe('sent')
    expect(response.status).toHaveBeenCalledWith(code || 500)
    expect(response.json).toHaveBeenCalledWith({ error })
  })
  describe('production log detail exposure', () => {
    beforeEach(() => {
      vi.stubEnv('NODE_ENV', 'production')
      const response = { status: vi.fn().mockReturnThis(), json: vi.fn() }
      handleError(
        response as any,
        'Internal server error',
        'fixture-private-detail',
        500,
      )
    })
    it('characterizes HTTP-redacted errors still being logged verbatim', () => {
      expect(console.log).toHaveBeenCalledWith(
        'ERROR: Internal server error',
        'fixture-private-detail',
      )
    })
    it.fails(
      '[known issue] production logs should redact provider-private error details',
      () => {
        expect(console.log).not.toHaveBeenCalledWith(
          'ERROR: Internal server error',
          'fixture-private-detail',
        )
      },
    )
  })
})

describe('IBM websocket error callback', () => {
  let rejection: unknown
  let response: {
    setHeader: ReturnType<typeof vi.fn>
    status: ReturnType<typeof vi.fn>
    json: ReturnType<typeof vi.fn>
  }
  beforeEach(async () => {
    const { handlers } = harness(iw, tmpdir())
    response = {
      setHeader: vi.fn(),
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    }
    const handler = handlers.get('/api/tts/ibm-watson/synthesize-speech')!
    const observed = Promise.resolve(
      handler(
        {
          body: {
            credentials: {
              apiKey: 'fixture-key',
              url: 'https://fixture.invalid',
            },
            payload: { text: 'hello', voice: 'fixture' },
            includeTimestamps: true,
          },
        } as any,
        response as any,
        vi.fn(),
      ),
    ).then(
      () => undefined,
      (error) => error,
    )
    await vi.waitFor(() => expect(boundary.ws).toHaveLength(1))
    boundary.ws[0].onerror()
    rejection = await observed
  })
  it('characterizes websocket rejection without a reason throwing while reading e.message', () => {
    expect(rejection).toBeInstanceOf(TypeError)
    expect((rejection as Error).message).toBe(
      "Cannot read properties of undefined (reading 'message')",
    )
    expect(response.status).not.toHaveBeenCalled()
  })
  it.fails(
    '[known issue] IBM websocket error should produce a handled 500 rather than reject',
    () => {
      expect(rejection).toBeUndefined()
      expect(response.status).toHaveBeenCalledWith(500)
    },
  )
})

describe('ElevenLabs disconnected response cancellation', () => {
  let cancel: ReturnType<typeof vi.fn>
  let stream: ReadableStream<Uint8Array>
  beforeEach(async () => {
    cancel = vi.fn()
    let controller!: ReadableStreamDefaultController<Uint8Array>
    stream = new ReadableStream({
      start(value) {
        controller = value
      },
      cancel,
    })
    boundary.fetch.mockResolvedValue({
      ok: true,
      body: stream,
      rawResponse: { headers: new Headers(), status: 200, statusText: 'OK' },
    })
    const { handlers } = harness(el, tmpdir())
    const response = Object.assign(new PassThrough(), { setHeader: vi.fn() })
    const handler = handlers.get('/api/tts/elevenlabs/synthesize-speech')!
    const pending = handler(
      {
        body: {
          credentials: { apiKey: 'fixture-key' },
          payload: { text: 'hello', voice: { voiceId: 'fixture' } },
        },
      } as any,
      response as any,
      vi.fn(),
    )
    await vi.waitFor(() => expect(stream.locked).toBe(true))
    response.destroy()
    controller.enqueue(Uint8Array.from([1, 2]))
    controller.close()
    await pending
  })
  it('characterizes a disconnected response draining provider audio without cancelling', () => {
    expect(cancel).not.toHaveBeenCalled()
    expect(stream.locked).toBe(false)
  })
  it.fails(
    '[known issue] disconnect should cancel upstream ElevenLabs stream',
    () => {
      expect(cancel).toHaveBeenCalledOnce()
    },
  )
})
