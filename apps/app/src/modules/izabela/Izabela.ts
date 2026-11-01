import { IzabelaMessagePayload } from '@/modules/izabela/types'
import { socket } from '@/services'
import IzabelaMessage from './IzabelaMessage'

export default () => {
  let currentlyPlayingMessage: ReturnType<typeof IzabelaMessage> | null = null

  let messageQueue: ReturnType<typeof IzabelaMessage>[] = []
  const readiness = new WeakMap<
    ReturnType<typeof IzabelaMessage>,
    ReturnType<ReturnType<typeof IzabelaMessage>['isReady']>
  >()

  function clearQueue() {
    const queued = messageQueue
    messageQueue = []
    queued.forEach((message) => message.cancel())
  }

  function onMessageEnd() {
    currentlyPlayingMessage = null
    playNextMessage()
  }

  function endCurrentMessage() {
    currentlyPlayingMessage?.cancel()
  }

  function endAllMessages() {
    clearQueue()
    currentlyPlayingMessage?.cancel()
    currentlyPlayingMessage = null
  }

  function playMessage(message: ReturnType<typeof IzabelaMessage>) {
    const socketPayload = message.getSocketPayload()
    let completed = false
    const onEnd = (hasError?: boolean) => {
      if (completed || currentlyPlayingMessage !== message) return
      completed = true
      if (hasError) message.cancel()
      if (hasError) socket.emit('message:error', socketPayload)
      socket.emit('message:end', socketPayload)
      onMessageEnd()
    }
    currentlyPlayingMessage = message
    message.on('ended', () => {
      onEnd()
    })
    message.on('error', () => {
      onEnd(true)
    })
    message.on('response:data', (data) => {
      socket.emit('message:response:data', {
        ...data,
        payload: socketPayload,
      })
    })
    message.on('timeupdate', (data) => {
      socket.emit('message:timeupdate', {
        ...data,
        payload: socketPayload,
      })
    })
    socket.emit('message:load', socketPayload)
    ;(readiness.get(message) || message.isReady())
      .then(() => {
        if (completed || currentlyPlayingMessage !== message) return
        socket.emit('message:start', socketPayload)
        return message.play()
      })
      .catch(() => onEnd(true))
    return message
  }

  function playNextMessage() {
    if (messageQueue.length > 0) {
      playMessage(messageQueue.shift()!)
    }
  }

  function createMessage(
    messagePayload: Partial<IzabelaMessagePayload> &
      Pick<IzabelaMessagePayload, 'engine'>,
  ) {
    const message = IzabelaMessage({
      message: '',
      originalMessage: '',
      translatedMessage: null,
      translatedFrom: null,
      translatedTo: null,
      payload: {},
      credentials: {},
      command: null,
      voice: null,
      ...messagePayload,
    })
    const ready = message.isReady()
    // Prefetching can fail before this message reaches the front of the queue.
    ready.catch(() => {})
    readiness.set(message, ready)
    return message
  }

  function queueMessage(message: ReturnType<typeof IzabelaMessage>) {
    messageQueue.push(message)
    return message
  }

  function say(
    messagePayload: IzabelaMessagePayload,
  ): ReturnType<typeof IzabelaMessage> {
    const message = createMessage(messagePayload)
    if (currentlyPlayingMessage) {
      return queueMessage(message)
    }
    return playMessage(message)
  }

  function play(url: string): ReturnType<typeof IzabelaMessage> {
    const message = createMessage({
      engine: 'external-audio',
      excludeFromHistory: true,
      payload: {
        url,
      },
    })
    if (currentlyPlayingMessage) {
      return queueMessage(message)
    }
    return playMessage(message)
  }

  socket.on('audio:play', play)

  return {
    say,
    endCurrentMessage,
    endAllMessages,
  }
}
