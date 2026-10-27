import {
  blobToBase64,
  Deferred,
  log,
  purify,
  structuredClone,
  serialize,
  deserialize,
  stringify,
  parse,
} from '..'
const data: Promise<string> = blobToBase64(new Blob(['test']))
const d = Deferred<{ value: number }>()
d.resolve({ value: 1 })
d.reject(new Error('cancelled'))
const promise: Promise<{ value: number }> = d.promise
const cloned: { value: number } = structuredClone({ value: 1 }, { lossy: true })
const records = serialize(cloned, { json: true })
const restored: { value: number } = deserialize<{ value: number }>(records)
const encoded: string = stringify(restored)
const decoded: { value: number } = parse<{ value: number }>(encoded)
const clean: { value: number } = purify(decoded)
const first: string = log<[string, number]>('value', 1)
type IsAny<T> = 0 extends 1 & T ? true : false
const inferred = log('first', 2)
const logIsNotAny: IsAny<typeof inferred> = false
const recordsAreNotAny: IsAny<typeof records> = false
const blobIsNotAny: IsAny<typeof data> = false
void [logIsNotAny, recordsAreNotAny, blobIsNotAny]
// @ts-expect-error First-argument return inference is not any.
const wrongLogReturn: number = log('text', 1)
void [data, promise, clean, first]
// @ts-expect-error Blob conversion does not accept a string.
blobToBase64('text')
// @ts-expect-error Deferred settlement must match its chosen type.
d.resolve({ value: 'bad' })
// @ts-expect-error Deferred promise preserves its resolved value type.
const wrongPromise: Promise<string> = d.promise
// @ts-expect-error serialize returns record tuples, not JSON text.
const wrongRecords: string = serialize({ value: 1 })
// @ts-expect-error deserialize consumes record tuples, not a string.
deserialize('[]')
// @ts-expect-error parse requires encoded text.
parse(12)
// @ts-expect-error Clone options are typed boolean flags.
structuredClone({}, { lossy: 'yes' })
// @ts-expect-error Cloning preserves input property types.
const wrongClone: { value: string } = structuredClone({ value: 1 })
// @ts-expect-error Tuple-parameter logging rejects missing arguments.
log<[string, number]>('only one')
