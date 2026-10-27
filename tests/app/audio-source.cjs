// The only substituted STT boundary is the physical capture process. The real
// recorder, PCM buffering, recognition SDK, IPC, history, and TTS still execute.
const { readFileSync } = require('node:fs')
const bytes = readFileSync(process.argv[2])
let data
for (let offset = 12; offset + 8 <= bytes.length; ) {
  const length = bytes.readUInt32LE(offset + 4)
  if (bytes.toString('ascii', offset, offset + 4) === 'data') {
    data = bytes.subarray(offset + 8, offset + 8 + length)
    break
  }
  offset += 8 + length + (length % 2)
}
if (!data) throw new Error('Missing WAV data chunk')
const rate = Number(process.argv[3] || 16000)
if (rate !== 16000) {
  const converted = Buffer.alloc(
    Math.floor(((data.length / 2) * rate) / 16000) * 2,
  )
  for (let index = 0; index < converted.length / 2; index++) {
    const position = (index * 16000) / rate
    const left = Math.min(Math.floor(position), data.length / 2 - 1)
    const right = Math.min(left + 1, data.length / 2 - 1)
    const value =
      data.readInt16LE(left * 2) * (1 - position + left) +
      data.readInt16LE(right * 2) * (position - left)
    converted.writeInt16LE(Math.round(value), index * 2)
  }
  data = converted
}
const pcm = Buffer.concat([
  Buffer.alloc(rate * 2),
  data,
  Buffer.alloc(rate * 6),
])
let offset = 0
setInterval(() => {
  const chunk = pcm.subarray(offset, offset + (rate / 50) * 2)
  offset = (offset + chunk.length) % pcm.length
  process.stdout.write(chunk)
}, 20)
