import { v4 as uuid } from 'uuid'
import { IzabelaMessageEvent, IzabelaMessagePayload } from '@/modules/izabela/types'
import mitt from 'mitt'

export default class {
  id = uuid()

  text: IzabelaMessagePayload['text']

  options: IzabelaMessagePayload['options']

  private emitter = mitt()

  constructor({ text, options }: IzabelaMessagePayload) {
    this.text = text
    this.options = options
  }

  on(event: IzabelaMessageEvent, callback: () => void): void {
    this.emitter.on(event, callback)
  }
}
