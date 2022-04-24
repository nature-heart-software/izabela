import { v4 as uuid } from 'uuid'
import mitt from 'mitt'
import { IzabelaMessageEvent, IzabelaMessagePayload } from './types'

export default class {
  id = uuid()

  text: IzabelaMessagePayload['text']

  options: IzabelaMessagePayload['options']

  private emitter = mitt()

  constructor({ text, options }: IzabelaMessagePayload) {
    this.text = text
    this.options = options
    // api.post
  }

  on(event: IzabelaMessageEvent, callback: () => void): void {
    this.emitter.on(event, callback)
  }
}
