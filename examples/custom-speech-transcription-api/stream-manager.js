const { PassThrough, Readable } = require('stream')
const { Writable } = require('node:stream')

class StreamManager {
  constructor() {
    this.streams = new Map()
  }

  createStream(audioId) {
    const stream = new PassThrough()
    const buffer = []
    this.streams.set(audioId, {
      liveStream: stream,
      buffer,
      done: false,
      consumed: false,
    })

    return new Writable({
      write: (chunk, encoding, callback) => {
        const entry = this.streams.get(audioId)
        if (entry) {
          buffer.push(chunk)
          stream.write(chunk)
        }
        callback()
      },
      final: (callback) => {
        stream.end()
        const entry = this.streams.get(audioId)
        if (entry) {
          entry.done = true
        }
        callback()
      },
    })
  }

  consume(audioId) {
    const entry = this.streams.get(audioId)
    if (!entry || entry.consumed) return null

    entry.consumed = true

    setTimeout(() => {
      entry.consumed = true
      this.streams.delete(audioId)
    }, 60 * 1000)

    if (entry.done) {
      return Readable.from(entry.buffer)
    }

    return entry.liveStream
  }
}

module.exports = StreamManager
