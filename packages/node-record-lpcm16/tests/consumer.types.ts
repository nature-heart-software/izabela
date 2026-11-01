import recorder = require('..')
import { record } from '..'
import type { Recording, RecordingOptions, RecorderArgument } from '..'
import type { ChildProcessWithoutNullStreams } from 'node:child_process'
import { PassThrough, type Readable } from 'node:stream'

const options: RecordingOptions = {
  sampleRate: 44100,
  channels: 2,
  recorder: 'sox',
  audioType: 'raw',
  threshold: 1,
  thresholdStart: '2%',
  thresholdEnd: null,
  silence: 2,
  endOnSilence: true,
  compress: false,
  binPath: '/fixture/sox',
  bufferSize: 4096,
  device: 'fixture-input',
  arguments: ['trim', 0, 1],
}
const recording: Recording = recorder.record(options)
const named: Recording = record()
const output: Readable = recording.stream()
const child: ChildProcessWithoutNullStreams = recording.process
const argument: RecorderArgument = recording.args[0]
const paused: boolean = recording.isPaused()
const restarted: Recording = recording.start()
const stopped: void = recording.stop()
const pause: void = recording.pause()
const resume: void = recording.resume()
output.pipe(new PassThrough())
output.on('error', (failure: Error | string) => {
  void failure
})
record({ recorder: 'custom-recorder-path', bufferSize: '8192', silence: '0.2' })
// @ts-expect-error Options must be an object.
record(3)
// @ts-expect-error Sample rates are numeric.
record({ sampleRate: '44100' })
// @ts-expect-error Command arguments contain only numbers or strings.
record({ arguments: [{}] })
// @ts-expect-error Stop returns void, not a fluent controller.
recording.stop().stream()
// @ts-expect-error The recording controller is not itself an EventEmitter.
recording.on('data', () => {})
// @ts-expect-error There is no public dispose method.
recording.dispose()
// @ts-expect-error The recording result must not degrade to any.
const invalid: number = record()
// @ts-expect-error stream returns a Node Readable, not bytes.
const bytes: Buffer = recording.stream()
void [
  named,
  output,
  child,
  argument,
  paused,
  restarted,
  stopped,
  pause,
  resume,
  invalid,
  bytes,
]
