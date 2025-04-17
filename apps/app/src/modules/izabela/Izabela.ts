import { IzabelaMessagePayload } from '@/modules/izabela/types'
import { socket } from '@/services'
import IzabelaMessage from './IzabelaMessage'

export default () => {
  let currentlyPlayingMessage: ReturnType<typeof IzabelaMessage> | null = null

  let messageQueue: ReturnType<typeof IzabelaMessage>[] = []

  function clearQueue() {
    if (messageQueue.length > 0) {
      messageQueue = []
    }
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
    const onEnd = (hasError?: boolean) => {
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
    message
      .isReady()
      .then(() => {
        socket.emit('message:start', socketPayload)
        return message.play()
      })
      .catch(() => onEnd(true))
    return message
  }

  function playNextMessage() {
    if (messageQueue.length > 0) {
      playMessage(messageQueue[0])
      messageQueue.splice(0, 1)
    }
  }

  function createMessage(messagePayload: Partial<IzabelaMessagePayload> & Pick<IzabelaMessagePayload, 'engine'>) {
    return IzabelaMessage({
      message: '',
      originalMessage: '',
      translatedMessage: null,
      translatedFrom: null,
      translatedTo: null,
      payload: {},
      credentials: {},
      command: null,
      voice: null,
      ...messagePayload
    })
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

  function stream(url: string): ReturnType<typeof IzabelaMessage> {
    const message = createMessage({
      engine: 'stream',
      payload: {
        url,
      },
    })
    if (currentlyPlayingMessage) {
      return queueMessage(message)
    }
    return playMessage(message)
  }

  socket.on('stream', stream)

  return {
    say,
    endCurrentMessage,
    endAllMessages,
  }
}
