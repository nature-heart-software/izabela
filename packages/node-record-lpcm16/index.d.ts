import type {
  ChildProcessWithoutNullStreams,
  SpawnOptionsWithoutStdio,
} from 'node:child_process'
import type { Readable } from 'node:stream'

/**
 * A recorder CLI argument; numeric values are passed through to child_process.spawn.
 * @example
 * ```ts
 * const argument: RecorderArgument = 16000
 * ```
 */
export type RecorderArgument = string | number

/**
 * Options passed to the selected recorder. Not every recorder supports every option.
 * `sox` supports device, buffer and extra arguments; `rec` supports silence effects;
 * `arecord` supports a device. Compression is currently retained but unused.
 * @example
 * ```ts
 * const options: RecordingOptions = { recorder: 'sox', sampleRate: 44100, channels: 2 }
 * ```
 */
export interface RecordingOptions {
  sampleRate?: number
  channels?: number
  compress?: boolean
  threshold?: number
  thresholdStart?: string | number | null
  thresholdEnd?: string | number | null
  silence?: string | number
  /** Included names are sox, rec and arecord; the loader also accepts module paths. */
  recorder?: string
  endOnSilence?: boolean
  audioType?: string
  binPath?: string | null
  bufferSize?: string | number | null
  arguments?: RecorderArgument[] | null
  device?: string | null
}

/**
 * The started controller returned by record. Data and errors are emitted by stream(),
 * not by the controller itself. Nonzero process-close errors currently emit strings;
 * stream failures may emit Error objects. No dispose/unsubscribe API is exposed.
 * @example
 * ```ts
 * const recording = record()
 * recording.stream().on('data', (chunk: Buffer) => console.log(chunk.length))
 * recording.stop()
 * ```
 */
export interface Recording {
  options: RecordingOptions
  cmd: string
  args: RecorderArgument[]
  cmdOptions: SpawnOptionsWithoutStdio & { encoding: 'binary'; stdio: 'pipe' }
  process: ChildProcessWithoutNullStreams
  /**
   * Starts another child and returns this controller. Does not stop a previous child.
   * @returns This controller.
   * @example
   * ```ts
   * const recording = record()
   * recording.stop()
   * recording.start()
   * ```
   */
  start(): this
  /**
   * Sends the default termination signal to the current child.
   * @returns Nothing.
   * @example
   * ```ts
   * record().stop()
   * ```
   */
  stop(): void
  /**
   * Sends SIGSTOP to the child and pauses its output stream.
   * @returns Nothing.
   * @example
   * ```ts
   * record().pause()
   * ```
   */
  pause(): void
  /**
   * Sends SIGCONT to the child and resumes its output stream.
   * @returns Nothing.
   * @example
   * ```ts
   * const recording = record()
   * recording.pause()
   * recording.resume()
   * ```
   */
  resume(): void
  /**
   * Reads the output stream's paused state.
   * @returns Whether the stream is paused.
   * @example
   * ```ts
   * const paused = record().isPaused()
   * ```
   */
  isPaused(): boolean
  /**
   * Returns the current child's readable stdout stream.
   * @returns The recording output stream.
   * @example
   * ```ts
   * const stream = record().stream()
   * ```
   */
  stream(): Readable
}

/**
 * Constructs a recording controller and immediately spawns the selected recorder.
 * @param options - Recorder configuration; omitted values use the controller defaults.
 * @returns An already started recording controller.
 * @example
 * ```ts
 * import { record } from 'node-record-lpcm16'
 * const recording = record({ recorder: 'sox', sampleRate: 16000 })
 * recording.stream().on('error', (error: Error | string) => console.error(error))
 * recording.stop()
 * ```
 */
export function record(options?: RecordingOptions): Recording
