import { IzabelaMessagePayload } from '@/modules/izabela/types'
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
    currentlyPlayingMessage = message
    message.on('ended', () => endMessage())
    message.on('error', () => endMessage())
    message
      .ready()
      .then(() => message.play())
      .catch(() => endMessage())
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
