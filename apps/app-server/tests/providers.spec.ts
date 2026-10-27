import { boundary, resetBoundaries } from './boundaries'
import { harness, request } from './http'
import { mkdtempSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Readable } from 'node:stream'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ap from '../src/plugins/speech-apis/ap'
import gc from '../src/plugins/speech-apis/gc'
import ma from '../src/plugins/speech-apis/ma'
import openai from '../src/plugins/speech-apis/openai'
import el from '../src/plugins/speech-apis/el'
import iw from '../src/plugins/speech-apis/iw'
import say from '../src/plugins/speech-apis/say'

let directory: string
beforeEach(() => {
  resetBoundaries()
  directory = mkdtempSync(join(tmpdir(), 'app-server-'))
  vi.spyOn(console, 'log').mockImplementation(() => {})
})
afterEach(() => {
  rmSync(directory, { recursive: true, force: true })
  vi.unstubAllEnvs()
})
const credentials = {
  apiKey: 'fixture-key',
  identityPoolId: 'fixture-pool',
  region: 'westus',
  url: 'https://fixture.invalid',
}
const api = (provider: string, action: string) =>
  `/api/tts/${provider}/${action}`
const body = (payload: unknown = {}, includeTimestamps = false) => ({
  credentials,
  payload,
  includeTimestamps,
})
const providers = [
  ['amazon-polly', ap, 3],
  ['google-cloud', gc, 3],
  ['microsoft-azure', ma, 3],
  ['openai', openai, 4],
  ['elevenlabs', el, 4],
  ['ibm-watson', iw, 3],
  ['say', say, 2],
] as const

describe('actual provider route dispatch and real HTTP responses', () => {
  it.each(providers)(
    'registers %s routes without constructing SDK clients',
    (name, plugin, count) => {
      const { handlers } = harness(plugin, directory)
      expect([...handlers.keys()]).toHaveLength(count)
      expect(
        [...handlers.keys()].every((path) =>
          path.startsWith(`/api/tts/${name}/`),
        ),
      ).toBe(true)
      expect(handlers.has(api(name, 'list-voices'))).toBe(true)
      expect(handlers.has(api(name, 'synthesize-speech'))).toBe(true)
      expect(boundary.fetch).not.toHaveBeenCalled()
      expect(boundary.polly).not.toHaveBeenCalled()
    },
  )
  it.each(providers.filter(([name]) => !['say', 'openai'].includes(name)))(
    '%s missing credentials rejects before handler try/catch (baseline validation)',
    async (name, plugin) => {
      const { handlers } = harness(plugin, directory)
      await expect(
        handlers.get(api(name, 'list-voices'))!(
          { body: {} } as any,
          {} as any,
          vi.fn(),
        ),
      ).rejects.toThrow(/(identityPoolId|apiKey)/)
      expect(boundary.fetch).not.toHaveBeenCalled()
      expect(boundary.get).not.toHaveBeenCalled()
    },
  )
  it.fails(
    '[known issue] missing Google credentials should produce a controlled 400 instead of rejecting',
    async () => {
      const { handlers } = harness(gc, directory)
      const response = { status: vi.fn().mockReturnThis(), json: vi.fn() }
      await expect(
        handlers.get(api('google-cloud', 'list-voices'))!(
          { body: {} } as any,
          response as any,
          vi.fn(),
        ),
      ).resolves.toBeUndefined()
      expect(response.status).toHaveBeenCalledWith(400)
    },
  )
  it('uses actual Express JSON parsing and returns 400 before provider dispatch on malformed JSON', async () => {
    const { app } = harness(gc, directory)
    const response = await request(
      app,
      api('google-cloud', 'list-voices'),
      {},
      'POST',
      '{broken',
    )
    expect(response.status).toBe(400)
    expect(boundary.get).not.toHaveBeenCalled()
  })
  it('returns 404 for unmatched routes', async () => {
    expect((await request(harness(gc, directory).app, '/unknown')).status).toBe(
      404,
    )
  })
})

describe('provider failures before response bytes', () => {
  it.each(providers.filter(([name]) => name !== 'openai'))(
    '%s voices failure maps to a production-safe HTTP error',
    async (name, plugin) => {
      vi.stubEnv('NODE_ENV', 'production')
      const error = new Error('fixture-provider-detail')
      boundary.get.mockRejectedValue(error)
      boundary.polly.mockRejectedValue(error)
      boundary.fetch.mockRejectedValue(error)
      boundary.ibmVoices.mockRejectedValue(error)
      boundary.voices.mockImplementation((callback) => callback(error))
      const response = await request(
        harness(plugin, directory).app,
        api(name, 'list-voices'),
        body(),
      )
      expect(response.status).toBe(500)
      expect(response.json()).toEqual({ error: 'Internal server error' })
    },
  )
})

describe('Google Cloud and Azure', () => {
  it('Azure omits timestamp metadata and word boundary configuration when disabled', async () => {
    const response = await request(
      harness(ma, directory).app,
      api('microsoft-azure', 'synthesize-speech'),
      body({ text: 'hello', voice: { Locale: 'en-US', ShortName: 'fixture' } }),
    )
    expect(response.buffer).toEqual(Buffer.from([1, 2, 3]))
    expect(response.headers.data).toBeUndefined()
    expect(
      boundary.azureConfig.mock.results[0].value.requestWordLevelTimestamps,
    ).not.toHaveBeenCalled()
    expect(boundary.azureClose).toHaveBeenCalledOnce()
  })
  it('Google voices forwards credential URL and unwraps voices', async () => {
    boundary.get.mockResolvedValue({
      data: { voices: [{ name: 'unicode ü' }] },
    })
    const response = await request(
      harness(gc, directory).app,
      api('google-cloud', 'list-voices'),
      body(),
    )
    expect(response.json()).toEqual([{ name: 'unicode ü' }])
    expect(boundary.get).toHaveBeenCalledWith(
      'https://texttospeech.googleapis.com/v1beta1/voices?key=fixture-key',
    )
  })
  it.each([false, true])(
    'Google decodes base64, overrides encoding and emits audio stream=%s',
    async (stream) => {
      boundary.post.mockResolvedValue({
        data: { audioContent: Buffer.from([0, 255, 42]).toString('base64') },
      })
      const response = await request(
        harness(gc, directory).app,
        api('google-cloud', `synthesize-speech${stream ? '/stream' : ''}`),
        body({
          input: { text: 'hello' },
          audioConfig: { audioEncoding: 'invalid', pitch: 2 },
        }),
      )
      expect(response.status).toBe(200)
      expect(response.buffer).toEqual(Buffer.from([0, 255, 42]))
      expect(response.headers['content-type']).toBe(
        stream ? 'audio/mpeg' : 'audio/wav',
      )
      expect(boundary.post.mock.calls[0][1]).toEqual({
        input: { text: 'hello' },
        audioConfig: { audioEncoding: stream ? 'MP3' : 'LINEAR16', pitch: 2 },
      })
    },
  )
  it.each(['westus', 'chinanorth2'])(
    'Azure voices chooses sovereign endpoint for %s',
    async (region) => {
      boundary.get.mockResolvedValue({ data: [{ ShortName: 'voice' }] })
      const response = await request(
        harness(ma, directory).app,
        api('microsoft-azure', 'list-voices'),
        { credentials: { ...credentials, region } },
      )
      expect(response.json()).toEqual([{ ShortName: 'voice' }])
      expect(boundary.get).toHaveBeenCalledWith(
        `https://${region}.tts.speech.${region.startsWith('china') ? 'azure.cn' : 'microsoft.com'}/cognitiveservices/voices/list`,
        { headers: { 'Ocp-Apim-Subscription-Key': 'fixture-key' } },
      )
    },
  )
  it.each([false, true])(
    'Azure selects text/SSML, timestamps and closes synthesizer ssml=%s',
    async (ssml) => {
      const response = await request(
        harness(ma, directory).app,
        api('microsoft-azure', 'synthesize-speech/stream'),
        body(
          {
            voice: { Locale: 'en-US', ShortName: 'fixture' },
            text: 'hello',
            ...(ssml ? { ssml: '<speak>hello</speak>' } : {}),
          },
          true,
        ),
      )
      expect(response.buffer).toEqual(Buffer.from([1, 2, 3]))
      expect(boundary.azure.mock.calls[0][4]).toBe(ssml ? 'ssml' : 'text')
      expect(boundary.azureClose).toHaveBeenCalledTimes(1)
      expect(JSON.parse(response.headers.data as string)).toEqual({
        timestamps: [{ text: 'hello', audioOffset: 100 }],
      })
      const config = boundary.azureConfig.mock.results[0].value
      expect(config).toMatchObject({
        speechSynthesisLanguage: 'en-US',
        speechSynthesisVoiceName: 'fixture',
      })
      expect(config.requestWordLevelTimestamps).toHaveBeenCalledOnce()
    },
  )
  it('Azure closes on synthesis error and redacts production HTTP details', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    boundary.azure.mockImplementation((_text, _success, failure) =>
      failure(new Error('fixture-private-detail')),
    )
    const response = await request(
      harness(ma, directory).app,
      api('microsoft-azure', 'synthesize-speech'),
      body({ voice: {}, text: 'hello' }),
    )
    expect(response.status).toBe(500)
    expect(response.json()).toEqual({ error: 'Internal server error' })
    expect(boundary.azureClose).toHaveBeenCalledOnce()
  })
})

describe('Amazon Polly actual commands and speech mark parsing', () => {
  it('uses installed DescribeVoicesCommand and Cognito config', async () => {
    boundary.polly.mockResolvedValue({ Voices: [{ Id: 'fixture' }] })
    const response = await request(
      harness(ap, directory).app,
      api('amazon-polly', 'list-voices'),
      body(),
    )
    expect(response.json()).toEqual([{ Id: 'fixture' }])
    expect(boundary.polly.mock.calls[0][0].constructor.name).toBe(
      'DescribeVoicesCommand',
    )
    expect(boundary.cognito).toHaveBeenCalledWith({
      clientConfig: { region: 'westus' },
      identityPoolId: 'fixture-pool',
    })
  })
  it('streams audio without a speech-mark request when timestamps disabled', async () => {
    boundary.polly.mockResolvedValue({
      AudioStream: Readable.from([Buffer.from('mp3')]),
    })
    const response = await request(
      harness(ap, directory).app,
      api('amazon-polly', 'synthesize-speech'),
      body({ Text: 'hello', VoiceId: 'fixture', OutputFormat: 'pcm' }),
    )
    expect(response.text).toBe('mp3')
    expect(boundary.polly).toHaveBeenCalledOnce()
    expect(boundary.polly.mock.calls[0][0].input).toEqual({
      Text: 'hello',
      VoiceId: 'fixture',
      OutputFormat: 'mp3',
    })
  })
  async function marks(finalNewline: boolean) {
    boundary.polly.mockImplementation(async (command) => ({
      AudioStream:
        command.input.OutputFormat === 'json'
          ? Readable.from([
              '{"time":1,',
              '"value":"ü"}\n\n{"time":2}',
              finalNewline ? '\n' : '',
            ])
          : Readable.from([Buffer.from('audio')]),
    }))
    return request(
      harness(ap, directory).app,
      api('amazon-polly', 'synthesize-speech/stream'),
      body({ Text: 'hello' }, true),
    )
  }
  it('parses split newline-delimited JSON with blank lines before starting audio', async () => {
    const response = await marks(true)
    expect(response.text).toBe('audio')
    expect(JSON.parse(response.headers.data as string)).toEqual({
      timestamps: [{ time: 1, value: 'ü' }, { time: 2 }],
    })
    expect(boundary.polly.mock.calls[1][0].input).toEqual({
      Text: 'hello',
      OutputFormat: 'json',
      SpeechMarkTypes: ['word'],
    })
  })
  it('characterizes dropped final speech mark without trailing newline', async () => {
    const response = await marks(false)
    expect(JSON.parse(response.headers.data as string)).toEqual({
      timestamps: [{ time: 1, value: 'ü' }],
    })
  })
  it.fails(
    '[known issue] Polly should retain final speech mark without trailing newline',
    async () => {
      const response = await marks(false)
      expect(
        JSON.parse(response.headers.data as string).timestamps,
      ).toHaveLength(2)
    },
  )
  it('handles a speech-mark stream error before response bytes', async () => {
    boundary.polly.mockImplementation(async (command) => ({
      AudioStream:
        command.input.OutputFormat === 'json'
          ? new Readable({
              read() {
                this.destroy(new Error('marks failed'))
              },
            })
          : Readable.from(['unused']),
    }))
    const response = await request(
      harness(ap, directory).app,
      api('amazon-polly', 'synthesize-speech'),
      body({}, true),
    )
    expect(response.status).toBe(500)
    expect(response.json()).toEqual({ error: 'marks failed' })
  })
})

describe('OpenAI installed SDK with injected fetch', () => {
  it('lists static voices/models without SDK calls', async () => {
    const { app } = harness(openai, directory)
    expect(
      (await request(app, api('openai', 'list-voices'), body())).json(),
    ).toContain('alloy')
    expect(
      (await request(app, api('openai', 'list-models'), body())).json(),
    ).toContain('gpt-4o-mini-tts')
    expect(boundary.fetch).not.toHaveBeenCalled()
  })
  it.each([false, true])(
    'serializes actual SDK request, default model/instructions, binary response stream=%s',
    async (stream) => {
      boundary.fetch.mockResolvedValue(
        new Response(Uint8Array.from([0, 1, 255]), {
          headers: { 'Content-Type': 'audio/mpeg' },
        }),
      )
      const response = await request(
        harness(openai, directory).app,
        api('openai', `synthesize-speech${stream ? '/stream' : ''}`),
        body({
          input: 'ü',
          voice: 'alloy',
          instructions: 'calm',
          userInstructions: 'slow',
        }),
      )
      expect(response.buffer).toEqual(Buffer.from([0, 1, 255]))
      expect(response.headers['content-type']).toBe('audio/mpeg')
      const [url, options] = boundary.fetch.mock.calls[0]
      expect(String(url)).toBe('https://api.openai.com/v1/audio/speech')
      expect(JSON.parse(options.body)).toEqual({
        input: 'ü',
        voice: 'alloy',
        model: 'gpt-4o-mini-tts',
        instructions:
          'Follow these default instructions: "calm". Follow these user provided instructions: "slow"',
        response_format: 'mp3',
      })
    },
  )
  it('forwards an explicit model and omits falsy instruction fragments', async () => {
    boundary.fetch.mockResolvedValue(new Response('audio'))
    await request(
      harness(openai, directory).app,
      api('openai', 'synthesize-speech'),
      body({ input: 'hello', voice: 'nova', model: 'tts-1' }),
    )
    expect(JSON.parse(boundary.fetch.mock.calls[0][1].body)).toMatchObject({
      model: 'tts-1',
      instructions: '',
    })
  })
  it('maps actual SDK HTTP error to production-safe JSON without retrying', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    boundary.fetch.mockResolvedValue(
      new Response(
        JSON.stringify({ error: { message: 'fixture-private-detail' } }),
        { status: 401, headers: { 'content-type': 'application/json' } },
      ),
    )
    const response = await request(
      harness(openai, directory).app,
      api('openai', 'synthesize-speech'),
      body({ input: 'hello', voice: 'alloy' }),
    )
    expect(response.status).toBe(500)
    expect(response.json()).toEqual({ error: 'Internal server error' })
    expect(boundary.fetch).toHaveBeenCalledOnce()
  })
})

describe('ElevenLabs installed SDK serialization and stream contracts', () => {
  const rawResponse = {
    headers: new Headers(),
    status: 200,
    statusText: 'OK',
    url: 'https://fixture.invalid',
    redirected: false,
    type: 'basic',
  }
  const ok = (response: unknown) => ({ ok: true, body: response, rawResponse })
  it('installed SDK rejects malformed timestamp JSON before writing response audio', async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('not-json\n'))
        controller.close()
      },
    })
    boundary.fetch.mockResolvedValue(ok(stream))
    const response = await request(
      harness(el, directory).app,
      api('elevenlabs', 'synthesize-speech'),
      body({ text: 'hello', voice: { voiceId: 'voice' } }, true),
    )
    expect(response.status).toBe(500)
    expect(response.json().error).toMatch(/JSON|Unexpected token/)
  })
  it('finishes an empty provider stream and releases its reader', async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.close()
      },
    })
    boundary.fetch.mockResolvedValue(ok(stream))
    const response = await request(
      harness(el, directory).app,
      api('elevenlabs', 'synthesize-speech'),
      body({ text: 'hello', voice: { voiceId: 'voice' } }),
    )
    expect(response.status).toBe(200)
    expect(response.buffer).toHaveLength(0)
    expect(stream.locked).toBe(false)
  })
  it('lists voices/models through installed methods and real response serializers', async () => {
    boundary.fetch
      .mockResolvedValueOnce(ok({ voices: [] }))
      .mockResolvedValueOnce(ok([]))
    const { app } = harness(el, directory)
    expect(
      (await request(app, api('elevenlabs', 'list-voices'), body())).json(),
    ).toEqual([])
    expect(
      (await request(app, api('elevenlabs', 'list-models'), body())).json(),
    ).toEqual([])
    expect(boundary.fetch.mock.calls[0][0].url).toBe(
      'https://api.elevenlabs.io/v1/voices',
    )
    expect(boundary.fetch.mock.calls[0][0].queryString).toContain(
      'show_legacy=true',
    )
    expect(boundary.fetch.mock.calls[1][0].url).toBe(
      'https://api.elevenlabs.io/v1/models',
    )
  })
  it('reads genuine Web ReadableStream and releases reader lock', async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(Uint8Array.from([1, 2]))
        controller.enqueue(Uint8Array.from([3]))
        controller.close()
      },
    })
    boundary.fetch.mockResolvedValue(ok(stream))
    const response = await request(
      harness(el, directory).app,
      api('elevenlabs', 'synthesize-speech/stream'),
      body({
        text: 'hello',
        voice: { voiceId: 'voice ü' },
        modelId: 'fixture',
        stability: 0.5,
        similarityBoost: 0.6,
        speed: 1.2,
      }),
    )
    expect(response.buffer).toEqual(Buffer.from([1, 2, 3]))
    expect(stream.locked).toBe(false)
    const args = boundary.fetch.mock.calls[0][0]
    expect(args.url).toContain('/v1/text-to-speech/voice%20%C3%BC/stream')
    expect(args.body).toMatchObject({
      text: 'hello',
      model_id: 'fixture',
      voice_settings: { stability: 0.5, similarity_boost: 0.6, speed: 1.2 },
    })
  })
  it('releases lock on reader error and returns handled error before bytes', async () => {
    const stream = new ReadableStream({
      start(controller) {
        controller.error(new Error('reader failed'))
      },
    })
    boundary.fetch.mockResolvedValue(ok(stream))
    const response = await request(
      harness(el, directory).app,
      api('elevenlabs', 'synthesize-speech'),
      body({ text: 'hello', voice: { voiceId: 'voice' } }),
    )
    expect(stream.locked).toBe(false)
    expect(response.status).toBe(500)
    expect(response.json()).toEqual({ error: 'reader failed' })
  })
  it('streams timestamp chunks, exposing only first alignment metadata', async () => {
    const alignment = {
      characters: ['a'],
      character_start_times_seconds: [0],
      character_end_times_seconds: [1],
    }
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        const lines =
          [
            { audio_base64: Buffer.from('a').toString('base64'), alignment },
            { audio_base64: Buffer.from('b').toString('base64') },
          ]
            .map((item) => JSON.stringify(item))
            .join('\n') + '\n'
        controller.enqueue(new TextEncoder().encode(lines))
        controller.close()
      },
    })
    boundary.fetch.mockResolvedValue(ok(stream))
    const response = await request(
      harness(el, directory).app,
      api('elevenlabs', 'synthesize-speech'),
      body({ text: 'hello', voice: { voiceId: 'voice' } }, true),
    )
    expect(response.text).toBe('ab')
    expect(JSON.parse(response.headers.data as string)).toEqual({
      timestamps: {
        alignment: {
          characters: ['a'],
          characterStartTimesSeconds: [0],
          characterEndTimesSeconds: [1],
        },
      },
    })
  })
})

describe('IBM SDK and websocket boundaries', () => {
  it('unwraps voices and pipes actual Readable synthesis with accept override', async () => {
    const { app } = harness(iw, directory)
    expect(
      (await request(app, api('ibm-watson', 'list-voices'), body())).json(),
    ).toEqual([{ name: 'fixture' }])
    const response = await request(
      app,
      api('ibm-watson', 'synthesize-speech'),
      body({ text: 'hello', voice: 'fixture', accept: 'wrong' }),
    )
    expect(response.text).toBe('ibm')
    expect(boundary.ibmSynthesize).toHaveBeenCalledWith({
      text: 'hello',
      voice: 'fixture',
      accept: 'audio/mpeg',
    })
  })
  it('parses websocket text timings and binary audio, sends actual protocol after open', async () => {
    const pending = request(
      harness(iw, directory).app,
      api('ibm-watson', 'synthesize-speech/stream'),
      body(
        {
          text: 'hello',
          voice: 'fixture',
          ratePercentage: 10,
          pitchPercentage: 20,
        },
        true,
      ),
    )
    void pending.catch(() => {})
    await vi.waitFor(() => expect(boundary.ws).toHaveLength(1))
    const websocket = boundary.ws[0]
    expect(websocket.url).toBe(
      'wss://fixture.invalid/v1/synthesize?voice=fixture&rate_percentage=10&pitch_percentage=20',
    )
    websocket.onopen()
    expect(JSON.parse(websocket.send.mock.calls[0][0])).toEqual({
      text: 'hello',
      accept: 'audio/mpeg',
      timings: ['words'],
    })
    websocket.onmessage({ data: '{"words":[["hello",0,1]]}' })
    websocket.onmessage({ data: Buffer.from([1, 2]) })
    websocket.onclose()
    const response = await pending
    expect(response.buffer).toEqual(Buffer.from([1, 2]))
    expect(JSON.parse(response.headers.data as string)).toEqual({
      timestamps: [['hello', 0, 1]],
    })
  })
})

describe('say filesystem lifecycle with no OS speech', () => {
  it('supports GET and POST voice inventory without native execution', async () => {
    const { app } = harness(say, directory)
    expect(
      (await request(app, api('say', 'list-voices'), {}, 'GET')).json(),
    ).toEqual(['fixture'])
    expect((await request(app, api('say', 'list-voices'))).json()).toEqual([
      'fixture',
    ])
  })
  it('exports into configured temp directory, streams bytes, then deletes fixture file', async () => {
    const response = await request(
      harness(say, directory).app,
      api('say', 'synthesize-speech'),
      { payload: { text: 'hello', voice: 'voice' } },
    )
    expect(response.text).toBe('RIFFfixture')
    expect(response.headers['content-type']).toBe('audio/wav')
    await vi.waitFor(() => expect(readdirSync(directory)).toEqual([]))
    expect(boundary.export.mock.calls[0].slice(0, 3)).toEqual([
      'hello',
      'voice',
      1,
    ])
    expect(boundary.export.mock.calls[0][3]).toContain(directory)
  })
  it('deletes created file on export callback error', async () => {
    boundary.export.mockImplementation(
      (_text, _voice, _speed, _path, callback) =>
        callback(new Error('export failed')),
    )
    const response = await request(
      harness(say, directory).app,
      api('say', 'synthesize-speech'),
      { payload: { text: 'hello', speed: 2 } },
    )
    expect(response.status).toBe(500)
    expect(response.json()).toEqual({ error: 'export failed' })
    expect(readdirSync(directory)).toEqual([])
  })
})
