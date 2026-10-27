import animalese from '..'

type Assert<T extends true> = T
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B
  ? 1
  : 2
  ? true
  : false
type IsAny<T> = 0 extends 1 & T ? true : false
type Audio = ReturnType<typeof animalese.getAudio>

type AudioIsTyped = Assert<Equal<IsAny<Audio>, false>>
type SourceIsBytes = Assert<Equal<typeof animalese.letter_library, Uint8Array>>
type SamplesIncludeOutOfRangeReads = Assert<
  Equal<Audio['data'], (number | undefined)[]>
>
type WaveBytesIncludeOutOfRangeReads = Assert<
  Equal<Audio['wav'], (number | undefined)[]>
>
type URIIsString = Assert<Equal<Audio['dataURI'], string>>
type SampleRateIsNumber = Assert<Equal<Audio['header']['sampleRate'], number>>
type ByteRateIsNumber = Assert<Equal<Audio['header']['byteRate'], number>>
type ChunkIdIsBytes = Assert<Equal<Audio['header']['chunkId'], number[]>>
type EncoderReturnsVoid = Assert<Equal<ReturnType<Audio['Make']>, void>>
type TextIsRequired = Assert<
  Equal<Parameters<typeof animalese.getAudio>, [string, boolean, number]>
>

const wave = animalese.getAudio('Hello', true, 1)
const uri: string = wave.dataURI
const rate: number = wave.header.sampleRate
const firstSample: number | undefined = wave.data[0]
wave.Make([0, 127, 255])
wave.Make()

// @ts-expect-error The URI is a string, not a numeric handle.
const numericURI: number = wave.dataURI
// @ts-expect-error The result has no playback method.
wave.play()
// @ts-expect-error Text is not optional.
animalese.getAudio()
// @ts-expect-error Shortening is a boolean flag.
animalese.getAudio('Hello', 'yes', 1)
// @ts-expect-error Pitch is numeric.
animalese.getAudio('Hello', false, '1')
// @ts-expect-error The encoder accepts sample arrays, not text.
wave.Make('samples')

void [uri, rate, firstSample, numericURI]
