import mitt from 'mitt'
import { IzabelaMessagePayload } from '@/modules/izabela/types'
import IzabelaMessage from './IzabelaMessage'

export default class {
  private currentlyPlayingMessage: IzabelaMessage | null = null

  private messageQueue: IzabelaMessage[] = []

  private emitter = mitt()

  public say(messagePayload: IzabelaMessagePayload): IzabelaMessage {
    const message = this.createMessage(messagePayload)
    if (this.currentlyPlayingMessage) {
      return this.queueMessage(message)
    }
    return this.playMessage(message)
  }

  public endMessage() {
    // TODO: stop currently playing message if that's even possible
    this.currentlyPlayingMessage = null
    this.playNextMessage()
  }

  public endAllMessages() {
    this.currentlyPlayingMessage = null
    this.clearQueue()
  }

  private createMessage(messagePayload: IzabelaMessagePayload) {
    return new IzabelaMessage(messagePayload)
  }

  private queueMessage(message: IzabelaMessage) {
    this.messageQueue.push(message)
    return message
  }

  private playMessage(message: IzabelaMessage) {
    message.on('ended', () => this.endMessage())
    message.on('error', () => this.endMessage())
    this.currentlyPlayingMessage = message
    this.emitter.emit('say', message)
    return message
  }

  private playNextMessage() {
    if (this.messageQueue.length > 0) {
      this.playMessage(this.messageQueue[0])
      this.messageQueue.splice(0, 1)
    }
  }

  private clearQueue() {
    if (this.messageQueue.length > 0) {
      this.messageQueue = []
    }
  }
}
