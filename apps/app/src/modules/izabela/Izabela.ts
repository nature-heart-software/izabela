import mitt from 'mitt'
import { IzabelaMessagePayload } from '@/modules/izabela/types'
import IzabelaMessage from './IzabelaMessage'

export default class {
  private currentlyPlayingMessage: IzabelaMessage | null = null

  private messageQueue: IzabelaMessage[] = []

  private emitter = mitt()

  public say({ text, options }: IzabelaMessagePayload): IzabelaMessage {
    const message = this.createMessage({
      text,
      options,
    })
    if (this.currentlyPlayingMessage) {
      return this.queueMessage(message)
    }
    return this.playMessage(message)
  }

  public endMessage() {
    // stop from message if that's even possible
    this.currentlyPlayingMessage = null
    this.playNextMessage()
  }

  public endAllMessages() {
    this.currentlyPlayingMessage = null
    this.clearQueue()
  }

  private createMessage({ text, options }: IzabelaMessagePayload) {
    const message = new IzabelaMessage({
      text,
      options,
    })
    message.on('end', () => this.endMessage())
    return message
  }

  private queueMessage(message: IzabelaMessage) {
    this.messageQueue.push(message)
    return message
  }

  private playMessage(message: IzabelaMessage) {
    this.currentlyPlayingMessage = message
    this.emitter.emit('say', message)
    return message
  }

  private playNextMessage() {
    if (this.messageQueue.length > 0) {
      this.emitter.emit('say', this.messageQueue[0])
      this.messageQueue.splice(0, 1)
    }
  }

  private clearQueue() {
    if (this.messageQueue.length > 0) {
      this.messageQueue = []
    }
  }
}
