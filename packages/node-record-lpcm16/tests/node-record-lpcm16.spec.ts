import { once } from 'node:events'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { loadRecorder } from './source-loader'
import type { RecordingOptions } from '..'

const harnesses: ReturnType<typeof loadRecorder>[] = []
function setup(options?: Parameters<typeof loadRecorder>[0]) {
  const harness = loadRecorder(options)
  harnesses.push(harness)
  return harness
}
afterEach(() => {
  for (const harness of harnesses.splice(0)) harness.cleanup()
})

const defaults = {
  sampleRate: 16000,
  channels: 1,
  compress: false,
  threshold: 0.5,
  thresholdStart: null,
  thresholdEnd: null,
  silence: '1.0',
  recorder: 'sox',
  endOnSilence: false,
  audioType: 'wav',
  binPath: null,
  bufferSize: null,
  arguments: [],
}
const baseArgs = {
  sox: [
    '--default-device',
    '--no-show-progress',
    '--rate',
    16000,
    '--channels',
    1,
    '--encoding',
    'signed-integer',
    '--bits',
    '16',
    '--type',
    'wav',
    '-',
  ],
  rec: [
    '-q',
    '-r',
    16000,
    '-c',
    1,
    '-e',
    'signed-integer',
    '-b',
    '16',
    '-t',
    'wav',
    '-',
  ],
  arecord: ['-q', '-r', 16000, '-c', 1, '-t', 'wav', '-f', 'S16_LE', '-'],
}
const names = ['sox', 'rec', 'arecord'] as const

describe('actual recorder builders and dispatch', () => {
  it.each(names)(
    '%s uses exact defaults and automatic start with piped binary streams',
    (recorder) => {
      const { api, spawn, children, log } = setup()
      const recording = api.record({ recorder })
      expect(recording.options).toEqual({ ...defaults, recorder })
      expect(recording.cmd).toBe(recorder)
      expect(recording.args).toEqual(baseArgs[recorder])
      expect(spawn.mock.calls).toEqual([
        [recorder, baseArgs[recorder], { encoding: 'binary', stdio: 'pipe' }],
      ])
      expect(recording.process).toBe(children[0])
      expect(recording.stream()).toBe(children[0].stdout)
      expect(log.mock.calls).toEqual([
        ['Running SOX', ` ${recorder} ${baseArgs[recorder].join(' ')}`],
      ])
    },
  )

  it.each(names)(
    '%s forwards sample rate, channels, type and custom binary without mutating input',
    (recorder) => {
      const { api, spawn } = setup()
      const options = {
        recorder,
        sampleRate: 44100,
        channels: 2,
        audioType: 'raw',
        binPath: '/fixture recorder/custom binary',
      }
      const before = { ...options }
      const recording = api.record(options)
      expect(recording.cmd).toBe(options.binPath)
      expect(recording.args).toEqual(
        baseArgs[recorder].map((arg) =>
          arg === 16000 ? 44100 : arg === 1 ? 2 : arg === 'wav' ? 'raw' : arg,
        ),
      )
      expect(spawn).toHaveBeenCalledTimes(1)
      expect(options).toEqual(before)
    },
  )

  it('uses AUDIODEV only for sox, inherits the supplied environment and appends buffer/custom arguments', () => {
    const { api, environment } = setup()
    const arguments_ = ['gain', '-3', '--literal spaces']
    const recording = api.record({
      device: 'fixture-input',
      bufferSize: 4096,
      arguments: arguments_,
    })
    expect(recording.args).toEqual([
      ...baseArgs.sox,
      '--buffer',
      4096,
      ...arguments_,
    ])
    expect(recording.cmdOptions).toEqual({
      encoding: 'binary',
      stdio: 'pipe',
      env: { ...environment, AUDIODEV: 'fixture-input' },
    })
    expect(environment).toEqual({ FIXTURE_ENVIRONMENT: 'recorder-test-data' })
    expect(arguments_).toEqual(['gain', '-3', '--literal spaces'])
  })

  it('prepends an arecord device and ignores unsupported silence, buffer, compress and custom argument options', () => {
    const { api } = setup()
    const recording = api.record({
      recorder: 'arecord',
      device: 'fixture:1',
      endOnSilence: true,
      bufferSize: 2048,
      arguments: ['ignored'],
      compress: true,
    })
    expect(recording.args).toEqual(['-D', 'fixture:1', ...baseArgs.arecord])
    expect(recording.cmdOptions).toEqual({ encoding: 'binary', stdio: 'pipe' })
  })

  it('rec ignores device, buffer, compress and custom arguments rather than silently gaining sox capabilities', () => {
    const { api } = setup()
    const recording = api.record({
      recorder: 'rec',
      device: 'ignored',
      bufferSize: 4096,
      compress: true,
      arguments: ['ignored'],
    })
    expect(recording.args).toEqual(baseArgs.rec)
    expect(recording.cmdOptions).toEqual({ encoding: 'binary', stdio: 'pipe' })
  })

  it.each(['sox', 'rec'] as const)(
    '%s uses percentage silence defaults and explicit threshold overrides',
    (recorder) => {
      const { api } = setup()
      expect(api.record({ recorder, endOnSilence: true }).args).toEqual([
        ...baseArgs[recorder],
        'silence',
        '1',
        '0.1',
        '0.5%',
        '1',
        '1.0',
        '0.5%',
      ])
      expect(
        api.record({
          recorder,
          endOnSilence: true,
          threshold: 3,
          thresholdStart: '2%',
          thresholdEnd: '4%',
          silence: 2,
        }).args,
      ).toEqual([
        ...baseArgs[recorder],
        'silence',
        '1',
        '0.1',
        '2%',
        '1',
        2,
        '4%',
      ])
      expect(
        api.record({
          recorder,
          endOnSilence: true,
          threshold: 0,
          thresholdStart: 0,
          thresholdEnd: 0,
        }).args,
      ).toEqual([
        ...baseArgs[recorder],
        'silence',
        '1',
        '0.1',
        '0%',
        '1',
        '1.0',
        '0%',
      ])
    },
  )

  it('sox adds custom arguments after silence effects and omits falsy device/buffer/bin overrides', () => {
    const { api } = setup()
    const recording = api.record({
      binPath: '',
      device: '',
      bufferSize: 0,
      endOnSilence: true,
      arguments: ['trim', 0, 1],
      compress: true,
    })
    expect(recording.cmd).toBe('sox')
    expect(recording.args).toEqual([
      ...baseArgs.sox,
      'silence',
      '1',
      '0.1',
      '0.5%',
      '1',
      '1.0',
      '0.5%',
      'trim',
      0,
      1,
    ])
    expect(recording.cmdOptions).toEqual({ encoding: 'binary', stdio: 'pipe' })
  })

  it('builds all actual modules directly and returns fresh arguments without altering options', () => {
    const { loadBuilder } = setup()
    for (const name of names) {
      const options: RecordingOptions = {
        ...defaults,
        recorder: name,
        arguments: ['gain', 1],
      }
      const before = JSON.stringify(options)
      const build = loadBuilder(name)
      const first = build(options)
      const second = build(options)
      expect(first).toEqual(second)
      expect(first.args).not.toBe(second.args)
      expect(JSON.stringify(options)).toBe(before)
    }
  })

  it('reports missing recorder modules before spawning and propagates other loader errors', () => {
    const { api, spawn } = setup()
    expect(() => api.record({ recorder: 'missing-fixture-recorder' })).toThrow(
      'No such recorder found: missing-fixture-recorder',
    )
    expect(spawn).not.toHaveBeenCalled()
    const failure = new Error('fixture dependency load failure')
    const controlled = setup({ loaderError: failure })
    expect(() => controlled.api.record({ recorder: 'failure' })).toThrow(
      failure,
    )
    expect(controlled.spawn).not.toHaveBeenCalled()
  })

  it('propagates synchronous spawn failures without substituting a fake recording', () => {
    const failure = new Error('controlled spawn failed')
    const { api, spawn, children } = setup({ spawnError: failure })
    expect(() => api.record()).toThrow(failure)
    expect(spawn).toHaveBeenCalledTimes(1)
    expect(children).toEqual([])
  })
})

describe('recording stream and lifecycle', () => {
  it('passes real binary data unchanged, observes stderr independently, and reaches stream end', async () => {
    const { api, children } = setup()
    const recording = api.record()
    const received: Buffer[] = []
    const errors = vi.fn()
    const stream = recording.stream()
    stream.on('data', (chunk) => received.push(chunk))
    stream.on('error', errors)
    const ended = once(stream, 'end')
    children[0].stderr.write('fixture diagnostics, not recorded audio')
    children[0].stdout.write(Buffer.from([0, 255, 17, 128]))
    children[0].stdout.end(Buffer.from([12, 0]))
    await ended
    children[0].emit('close', 0)
    expect(Buffer.concat(received)).toEqual(
      Buffer.from([0, 255, 17, 128, 12, 0]),
    )
    expect(errors).not.toHaveBeenCalled()
    expect(stream.readableEnded).toBe(true)
  })

  it('pauses real stream delivery and buffers data until resume while sending exact signals', async () => {
    const { api, children } = setup()
    const recording = api.record()
    const received: Buffer[] = []
    recording.stream().on('data', (chunk) => received.push(chunk))
    expect(recording.isPaused()).toBe(false)
    expect(recording.pause()).toBeUndefined()
    expect(recording.isPaused()).toBe(true)
    children[0].stdout.write(Buffer.from('queued fixture'))
    expect(received).toEqual([])
    const delivered = once(recording.stream(), 'data')
    expect(recording.resume()).toBeUndefined()
    await delivered
    expect(recording.isPaused()).toBe(false)
    expect(Buffer.concat(received).toString()).toBe('queued fixture')
    expect(children[0].kill.mock.calls).toEqual([['SIGSTOP'], ['SIGCONT']])
  })

  it('stop signals only its own process; current implementation retains stream references/listeners', () => {
    const { api, children } = setup()
    const first = api.record()
    const second = api.record()
    const stream = first.stream()
    const listeners = stream.listenerCount('data')
    expect(first.stop()).toBeUndefined()
    expect(children[0].kill.mock.calls).toEqual([[]])
    expect(children[1].kill).not.toHaveBeenCalled()
    expect(first.process).toBe(children[0])
    expect(first.stream()).toBe(stream)
    expect(stream.destroyed).toBe(false)
    expect(stream.listenerCount('data')).toBe(listeners)
    expect(second.options).not.toBe(first.options)
    expect(second.options.arguments).not.toBe(first.options.arguments)
  })

  it.each([1, 7, null])(
    'emits the exact existing string error on close code %s',
    (code) => {
      const { api, children } = setup()
      const recording = api.record({ binPath: 'fixture-recorder' })
      const errors = vi.fn()
      recording.stream().on('error', errors)
      children[0].emit('close', code)
      expect(errors.mock.calls).toEqual([
        [
          `fixture-recorder has exited with error code ${code}.\n\nEnable debugging with the environment variable DEBUG=record.`,
        ],
      ])
    },
  )

  it('forwards output-stream error identity without replacing the stream', () => {
    const { api, children } = setup()
    const recording = api.record()
    const errors = vi.fn()
    const failure = new Error('fixture output error')
    recording.stream().on('error', errors)
    children[0].stdout.emit('error', failure)
    expect(errors.mock.calls).toEqual([[failure]])
    expect(recording.stream()).toBe(children[0].stdout)
  })

  it('characterizes child-process errors as unhandled rather than forwarded to the recording stream', () => {
    const { api, children } = setup()
    const recording = api.record()
    const errors = vi.fn()
    const failure = new Error('fixture executable missing')
    recording.stream().on('error', errors)
    expect(() => children[0].emit('error', failure)).toThrow(failure)
    expect(errors).not.toHaveBeenCalled()
    expect(children[0].listenerCount('error')).toBe(0)
  })

  it.fails(
    '[known issue] child-process spawn errors should reach the public recording stream',
    () => {
      const { api, children } = setup()
      const recording = api.record()
      const errors = vi.fn()
      const failure = new Error('fixture executable missing')
      recording.stream().on('error', errors)
      // Contain the known unhandled EventEmitter error so only the desired assertion fails.
      children[0].on('error', () => {})
      children[0].emit('error', failure)
      expect(errors.mock.calls).toEqual([[failure]])
    },
  )

  it('characterizes start as replacing the child without stopping the previous recording', () => {
    const { api, children, spawn } = setup()
    const recording = api.record()
    const previous = recording.stream()
    expect(recording.start()).toBe(recording)
    expect(spawn).toHaveBeenCalledTimes(2)
    expect(recording.process).toBe(children[1])
    expect(recording.stream()).toBe(children[1].stdout)
    expect(recording.stream()).not.toBe(previous)
    expect(children[0].kill).not.toHaveBeenCalled()
    expect(children[0].listenerCount('close')).toBe(1)
  })

  it.fails(
    '[known issue] restarting should stop the previous child before replacing it',
    () => {
      const { api, children } = setup()
      const recording = api.record()
      recording.start()
      expect(children[0].kill).toHaveBeenCalledTimes(1)
    },
  )

  it.each(['stop', 'pause', 'resume', 'isPaused'] as const)(
    '%s rejects a controller whose process has not been started',
    (method) => {
      const { api } = setup()
      const recording = api.record()
      Reflect.deleteProperty(recording, 'process')
      expect(() => recording[method]()).toThrow('Recording not yet started')
    },
  )

  it('stream rejects a controller with no output stream', () => {
    const { api } = setup()
    const recording = api.record()
    Reflect.deleteProperty(recording, '_stream')
    expect(() => recording.stream()).toThrow('Recording not yet started')
  })
})
