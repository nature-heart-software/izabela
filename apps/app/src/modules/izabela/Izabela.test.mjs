import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import loadTypescript from '../../../../../tests/load-typescript.cjs'

const flush = () => new Promise((resolve) => setImmediate(resolve))
function fixture() {
  const messages = []
  const events = []
  const create = loadTypescript(
    fileURLToPath(new URL('./Izabela.ts', import.meta.url)),
    {
      '@/services': {
        socket: {
          on() {},
          emit: (name, payload) => events.push({ name, id: payload.id }),
        },
      },
      './IzabelaMessage': (payload) => {
        const emitter = new EventEmitter()
        let ready, fail
        const promise = new Promise((resolve, reject) => {
          ready = resolve
          fail = reject
        })
        // Keep the test fixture's rejected readiness handled independently of the queue.
        promise.catch(() => {})
        const message = {
          id: payload.message,
          plays: 0,
          cancels: 0,
          on: (...args) => emitter.on(...args),
          getSocketPayload: () => ({ id: payload.message }),
          isReady: () => promise,
          play() {
            this.plays++
            if (this.playError) return Promise.reject(this.playError)
          },
          cancel() {
            this.cancels++
            emitter.emit('ended')
          },
          ready,
          fail,
          end: () => emitter.emit('ended'),
          error: () => emitter.emit('error'),
        }
        messages.push(message)
        return message
      },
    },
  ).default
  return { queue: create(), messages, events }
}
const say = (f, text) => f.queue.say({ engine: 'fixture', message: text })

test('cancelling a loading message never starts it when its audio arrives later', async () => {
  const f = fixture()
  const a = say(f, 'A'),
    b = say(f, 'B')
  b.ready()
  f.queue.endCurrentMessage()
  await flush()
  a.ready()
  await flush()
  assert.equal(a.plays, 0)
  assert.equal(b.plays, 1)
  assert.deepEqual(
    f.events.filter((e) => e.name === 'message:start').map((e) => e.id),
    ['B'],
  )
})

test('error, rejected readiness and a late ended signal advance the queue only once', async () => {
  const f = fixture()
  const a = say(f, 'A'),
    b = say(f, 'B'),
    c = say(f, 'C')
  b.ready()
  c.ready()
  a.fail(new Error('Provider outage'))
  a.error()
  a.end()
  await flush()
  assert.equal(b.plays, 1)
  assert.equal(c.plays, 0)
  assert.equal(
    f.events.filter((e) => e.name === 'message:end' && e.id === 'A').length,
    1,
  )
  b.end()
  await flush()
  assert.equal(c.plays, 1)
})

test('cancel all cancels prefetched messages and late results cannot re-enter playback', async () => {
  const f = fixture()
  const a = say(f, 'A'),
    b = say(f, 'B'),
    c = say(f, 'C')
  f.queue.endAllMessages()
  for (const message of [a, b, c]) {
    message.ready()
    message.end()
  }
  await flush()
  assert.equal(a.cancels, 1)
  assert.equal(b.cancels, 1)
  assert.equal(c.cancels, 1)
  assert.ok(f.messages.every((message) => message.plays === 0))
  const d = say(f, 'D')
  d.ready()
  await flush()
  assert.equal(d.plays, 1)
})

test('a rejected playback promise does not block the next message', async () => {
  const f = fixture()
  const a = say(f, 'A'),
    b = say(f, 'B')
  a.playError = new Error('Audio output unavailable')
  a.ready()
  b.ready()
  await flush()
  assert.equal(b.plays, 1)
  assert.equal(f.events.filter((e) => e.name === 'message:error').length, 1)
})
