const { PassThrough, Readable } = require('stream');

class StreamManager {
  constructor() {
    this.streams = new Map();
  }

  createStream(audioId) {
    const stream = new PassThrough();
    const buffer = [];
    this.streams.set(audioId, {
      liveStream: stream,
      buffer,
      done: false,
      consumed: false,
    });

    return {
      write: (chunk) => {
        buffer.push(chunk);
        stream.write(chunk);
      },
      end: () => {
        stream.end();
        const entry = this.streams.get(audioId);
        if (entry) {
          entry.done = true;
        }
      },
    };
  }

  consume(audioId) {
    const entry = this.streams.get(audioId);
    if (!entry || entry.consumed) return null;

    entry.consumed = true;

    setTimeout(() => this.streams.delete(audioId), 10_000);

    if (entry.done) {
      return Readable.from(entry.buffer);
    }

    return entry.liveStream;
  }
}

module.exports = StreamManager;
