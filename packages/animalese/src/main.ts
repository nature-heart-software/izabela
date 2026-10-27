import animalese from './animalese'

/**
 * Mutable RIFF/PCM header fields used when encoding synthesized samples.
 *
 * @example
 * ```ts
 * import animalese from '@packages/animalese'
 * const header = animalese.getAudio('Hello', false, 1).header
 * console.log(header.sampleRate, header.bitsPerSample)
 * ```
 */
export interface AnimaleseWaveHeader {
  chunkId: number[]
  chunkSize: number
  format: number[]
  subChunk1Id: number[]
  subChunk1Size: number
  audioFormat: number
  numChannels: number
  sampleRate: number
  /** The legacy encoder currently produces NaN here and serializes it as zero. */
  byteRate: number
  blockAlign: number
  bitsPerSample: number
  subChunk2Id: number[]
  subChunk2Size: number
}

/**
 * Synthesized PCM samples, serialized WAV bytes, and their base64 data URI.
 * Out-of-range source reads can produce undefined samples because pitch is not validated.
 *
 * @example
 * ```ts
 * import animalese from '@packages/animalese'
 * const wave = animalese.getAudio('Hello', true, 1)
 * const audio = new Audio(wave.dataURI)
 * ```
 */
export interface AnimaleseWave {
  data: (number | undefined)[]
  wav: (number | undefined)[]
  dataURI: string
  header: AnimaleseWaveHeader
  /**
   * Re-encodes samples using the mutable header and refreshes wav and dataURI.
   *
   * @param data - Replacement samples; omit to re-encode the existing samples.
   * @returns Nothing; updates the wave in place.
   *
   * @example
   * ```ts
   * import animalese from '@packages/animalese'
   * const wave = animalese.getAudio('', false, 1)
   * wave.Make([0, 127, 255])
   * ```
   */
  Make(data?: (number | undefined)[]): void
}

/**
 * Synchronous Animalese synthesizer backed by the bundled WAV letter library.
 *
 * @example
 * ```ts
 * import animalese from '@packages/animalese'
 * const uri = animalese.getAudio('Hello world', true, 1).dataURI
 * ```
 */
export default animalese as {
  /** Complete source WAV bytes, including its 44-byte PCM header. */
  letter_library: Uint8Array
  /**
   * Produces mono 8-bit PCM at 44100 Hz with 3307 output samples per processed character.
   *
   * @param text - ASCII letters to pronounce; other characters become silence unless shortening.
   * @param shorten - Keep only the first and last ASCII letter of each word and omit separators.
   * @param pitch - Source-sample step; not validated or clamped to the source library.
   * @returns A fresh mutable wave with samples, header, WAV bytes, and data URI.
   *
   * @example
   * ```ts
   * import animalese from '@packages/animalese'
   * const wave = animalese.getAudio('Hello', false, 1.5)
   * ```
   */
  getAudio: (text: string, shorten: boolean, pitch: number) => AnimaleseWave
}
