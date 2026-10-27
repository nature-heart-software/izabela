import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { afterAll, describe, expect, it, vi } from 'vitest'

vi.hoisted(() => {
  vi.stubGlobal('window', { atob: globalThis.atob })
})

vi.mock('../src/animalese.js/animalese.wav?url', async () => {
  const { readFileSync } = await import('node:fs')
  const bytes = readFileSync(
    new URL('../src/animalese.js/animalese.wav', import.meta.url),
  )
  return { default: `data:audio/wav;base64,${bytes.toString('base64')}` }
})

import animalese from '../src/main'

const source = readFileSync(
  new URL('../src/animalese.js/animalese.wav', import.meta.url),
)
const samplesPerLetter = 3307
const libraryStride = 6615

function letterSamples(letter: string, pitch = 1) {
  const offset = 44 + (letter.charCodeAt(0) - 65) * libraryStride
  return Array.from(
    { length: samplesPerLetter },
    (_, index) => source[offset + Math.floor(index * pitch)],
  )
}

function sampleBytes(samples: readonly (number | undefined)[]) {
  return Buffer.from(
    samples.map((sample) => {
      if (sample === undefined)
        throw new Error('Cannot serialize an undefined PCM sample')
      return sample
    }),
  )
}

function decodedURI(dataURI: string) {
  expect(dataURI).toMatch(/^data:audio\/wav;base64,/)
  return Buffer.from(dataURI.slice('data:audio/wav;base64,'.length), 'base64')
}

afterAll(() => {
  vi.unstubAllGlobals()
})

describe('animalese public synthesis', () => {
  it('loads the complete real mono 8-bit PCM letter library without changing its bytes', () => {
    expect(createHash('sha256').update(source).digest('hex')).toBe(
      '0a3538776352c79e4464533eda2ed15889782774cd0ce946255d019782c09a80',
    )
    expect(source.length).toBe(172034)
    expect(source.readUInt32LE(24)).toBe(44100)
    expect(source.readUInt16LE(22)).toBe(1)
    expect(source.readUInt16LE(34)).toBe(8)
    expect(source.readUInt32LE(40)).toBe(171990)
    expect(animalese.letter_library).toBeInstanceOf(Uint8Array)
    expect(Buffer.from(animalese.letter_library)).toEqual(source)
  })

  it('produces deterministic real-WAV samples and a stable waveform digest', () => {
    const first = animalese.getAudio('AZ', false, 1)
    const second = animalese.getAudio('AZ', false, 1)
    expect(first.data).toEqual([...letterSamples('A'), ...letterSamples('Z')])
    expect(first.data.length).toBe(6614)
    expect(new Set(first.data).size).toBeGreaterThan(100)
    expect(
      createHash('sha256').update(sampleBytes(first.data)).digest('hex'),
    ).toBe('e69a70d3a5bfc7ddc56b63100dfde50f4f1752c8543d200bd65b8e659f13e2a2')
    expect(second.data).toEqual(first.data)
    expect(second.wav).toEqual(first.wav)
    expect(second.dataURI).toBe(first.dataURI)
  })

  it('selects the correct source segment for all 26 ASCII letters', () => {
    for (const letter of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
      expect(animalese.getAudio(letter, false, 1).data, letter).toEqual(
        letterSamples(letter),
      )
    }
  })

  it('encodes the exact RIFF, PCM, and data sizes in the serialized header', () => {
    const wave = animalese.getAudio('AZ', false, 1)
    const bytes = sampleBytes(wave.wav)
    expect(bytes.length).toBe(6658)
    expect(bytes.toString('ascii', 0, 4)).toBe('RIFF')
    expect(bytes.readUInt32LE(4)).toBe(6650)
    expect(bytes.toString('ascii', 8, 16)).toBe('WAVEfmt ')
    expect(bytes.readUInt32LE(16)).toBe(16)
    expect(bytes.readUInt16LE(20)).toBe(1)
    expect(bytes.readUInt16LE(22)).toBe(1)
    expect(bytes.readUInt32LE(24)).toBe(44100)
    expect(bytes.readUInt16LE(32)).toBe(1)
    expect(bytes.readUInt16LE(34)).toBe(8)
    expect(bytes.toString('ascii', 36, 40)).toBe('data')
    expect(bytes.readUInt32LE(40)).toBe(6614)
    expect(bytes.subarray(44)).toEqual(sampleBytes(wave.data))
    expect(wave.header).toEqual({
      chunkId: [82, 73, 70, 70],
      chunkSize: 6650,
      format: [87, 65, 86, 69],
      subChunk1Id: [102, 109, 116, 32],
      subChunk1Size: 16,
      audioFormat: 1,
      numChannels: 1,
      sampleRate: 44100,
      byteRate: Number.NaN,
      blockAlign: 1,
      bitsPerSample: 8,
      subChunk2Id: [100, 97, 116, 97],
      subChunk2Size: 6614,
    })
  })

  it.each([false, true])(
    'returns a header-only WAV for empty input (shorten=%s)',
    (shorten) => {
      const wave = animalese.getAudio('', shorten, 1)
      expect(wave.data).toEqual([])
      expect(wave.wav.length).toBe(44)
      expect(wave.header.chunkSize).toBe(36)
      expect(wave.header.subChunk2Size).toBe(0)
      expect(decodedURI(wave.dataURI)).toEqual(sampleBytes(wave.wav))
    },
  )

  it('normalizes lowercase and mixed ASCII case before selecting samples', () => {
    const uppercase = animalese.getAudio('AZBY', false, 1)
    expect(animalese.getAudio('azby', false, 1).data).toEqual(uppercase.data)
    expect(animalese.getAudio('aZbY', false, 1).dataURI).toBe(uppercase.dataURI)
  })

  it('preserves one 127-valued silent segment per non-pronounceable character', () => {
    const punctuation = ' !9\né'
    const silence = new Array(punctuation.length * samplesPerLetter).fill(127)
    const wave = animalese.getAudio(`A${punctuation}Z`, false, 1)
    expect(wave.data).toEqual([
      ...letterSamples('A'),
      ...silence,
      ...letterSamples('Z'),
    ])
    expect(animalese.getAudio(punctuation, false, 2).data).toEqual(silence)
  })

  it.each([
    ['hello world', 'HOWD'],
    ['a to I', 'ATOI'],
    ['Hello,\tWORLD!!  42', 'HOWD'],
    ['a-b_c', 'ABC'],
    ['!? 123', ''],
    ['ab', 'AB'],
  ])(
    'shortens %j to first/last ASCII letters %j without separator silence',
    (text, shortened) => {
      const wave = animalese.getAudio(text, true, 1)
      expect(wave.data.length).toBe(shortened.length * samplesPerLetter)
      expect(wave.data).toEqual(animalese.getAudio(shortened, false, 1).data)
    },
  )

  it.each([0.5, 1.25, 2])(
    'resamples real source bytes with floor indexing at pitch %s without changing duration',
    (pitch) => {
      const wave = animalese.getAudio('BZ', false, pitch)
      expect(wave.data).toEqual([
        ...letterSamples('B', pitch),
        ...letterSamples('Z', pitch),
      ])
      expect(wave.data.length).toBe(6614)
      expect(wave.header.sampleRate).toBe(44100)
      expect(wave.data).not.toEqual(animalese.getAudio('BZ', false, 1).data)
    },
  )

  it.each(['', 'A', 'AB', 'ABC'])(
    'base64 round-trips every WAV byte including padding for %j',
    (text) => {
      const wave = animalese.getAudio(text, false, 1)
      expect(decodedURI(wave.dataURI)).toEqual(sampleBytes(wave.wav))
      expect(wave.dataURI).toBe(
        `data:audio/wav;base64,${sampleBytes(wave.wav).toString('base64')}`,
      )
    },
  )

  it('does not mutate source samples or share result arrays across calls', () => {
    const before = animalese.letter_library.slice()
    const first = animalese.getAudio('Animalese!', true, 1.5)
    const second = animalese.getAudio('Animalese!', true, 1.5)
    expect(first).not.toBe(second)
    expect(first.data).not.toBe(second.data)
    expect(first.wav).not.toBe(second.wav)
    expect(first.header).not.toBe(second.header)
    first.data[0] = 0
    first.wav[44] = 0
    first.header.sampleRate = 8000
    expect(second.data[0]).toBe(source[44])
    expect(second.wav[44]).toBe(source[44])
    expect(second.header.sampleRate).toBe(44100)
    expect(animalese.letter_library).toEqual(before)
    expect(Buffer.from(animalese.letter_library)).toEqual(source)
  })

  it('re-encodes replacement samples and can reuse them after header changes', () => {
    const wave = animalese.getAudio('A', false, 1)
    const samples = [0, 127, 255]
    expect(wave.Make(samples)).toBeUndefined()
    expect(wave.data).toBe(samples)
    expect(wave.header.subChunk2Size).toBe(samples.length)
    expect(decodedURI(wave.dataURI).subarray(44)).toEqual(Buffer.from(samples))
    wave.header.sampleRate = 22050
    wave.Make()
    expect(wave.data).toBe(samples)
    expect(decodedURI(wave.dataURI).readUInt32LE(24)).toBe(22050)
    expect(decodedURI(wave.dataURI).subarray(44)).toEqual(Buffer.from(samples))
  })

  it('serializes signed 16-bit samples in little-endian order when requested through the mutable header', () => {
    const wave = animalese.getAudio('', false, 1)
    const samples = [-32768, -1, 0, 32767]
    const expected = Buffer.alloc(samples.length * 2)
    samples.forEach((sample, index) => expected.writeInt16LE(sample, index * 2))
    wave.header.bitsPerSample = 16
    wave.Make(samples)
    expect(wave.header.blockAlign).toBe(2)
    expect(wave.header.subChunk2Size).toBe(expected.length)
    expect(wave.header.chunkSize).toBe(36 + expected.length)
    expect(decodedURI(wave.dataURI).subarray(44)).toEqual(expected)
    expect(decodedURI(wave.dataURI)).toEqual(sampleBytes(wave.wav))
  })

  it('characterizes unchecked high pitch as undefined source reads encoded as zero bytes', () => {
    const wave = animalese.getAudio('Z', false, 3)
    expect(wave.data).toEqual(letterSamples('Z', 3))
    expect(wave.data.length).toBe(samplesPerLetter)
    expect(
      wave.data.filter((sample) => sample === undefined).length,
    ).toBeGreaterThan(0)
    expect(wave.data.at(-1)).toBeUndefined()
    expect(wave.wav.slice(44)).toEqual(wave.data)
    expect(decodedURI(wave.dataURI).subarray(44)).toEqual(
      Buffer.from(wave.data.map((sample) => sample ?? 0)),
    )
  })

  it('characterizes the missing byte-rate source as NaN in memory and zero on disk', () => {
    const wave = animalese.getAudio('A', false, 1)
    expect(wave.data).toEqual(letterSamples('A'))
    expect(wave.header.byteRate).toBeNaN()
    expect(wave.wav.slice(28, 32)).toEqual([0, 0, 0, 0])
    expect(decodedURI(wave.dataURI).readUInt32LE(28)).toBe(0)
  })

  it.fails(
    '[known issue] writes the PCM byte rate required by the sample rate and block alignment',
    () => {
      const wave = animalese.getAudio('A', false, 1)
      expect(decodedURI(wave.dataURI).readUInt32LE(28)).toBe(44100)
    },
  )
})
