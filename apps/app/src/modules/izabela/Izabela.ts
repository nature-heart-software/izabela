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

  function endMessage() {
    // TODO: stop currently playing message if that's even possible
    currentlyPlayingMessage = null
    playNextMessage()
  }

  function endAllMessages() {
    currentlyPlayingMessage = null
    clearQueue()
  }

  function playMessage(message: ReturnType<typeof IzabelaMessage>) {
    const socketPayload = message.getSocketPayload()
    const onEnd = () => {
      socket.emit('message:end', socketPayload)
      return endMessage()
    }
    currentlyPlayingMessage = message
    message.on('ended', onEnd)
    message.on('error', onEnd)
    socket.emit('message:load', socketPayload)
    message
      .isReady()
      .then(() => {
        socket.emit('message:start', socketPayload)
        return message.play()
      })
      .catch(onEnd)
    return message
  }

  function playNextMessage() {
    if (messageQueue.length > 0) {
      playMessage(messageQueue[0])
      messageQueue.splice(0, 1)
    }
  }

  function createMessage(messagePayload: IzabelaMessagePayload) {
    return IzabelaMessage(messagePayload)
  }

  function queueMessage(message: ReturnType<typeof IzabelaMessage>) {
    messageQueue.push(message)
    return message
  }

  function say(messagePayload: IzabelaMessagePayload): ReturnType<typeof IzabelaMessage> {
    const message = createMessage(messagePayload)
    if (currentlyPlayingMessage) {
      return queueMessage(message)
    }
    return playMessage(message)
  }

  return {
    say,
    endMessage,
    endAllMessages,
  }
}
