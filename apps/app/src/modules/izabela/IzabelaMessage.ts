import { v4 as uuid } from 'uuid'
import mitt from 'mitt'
import { IzabelaMessageEvent, IzabelaMessagePayload } from './types'
import { Deferred } from '@/utils/deferred'
import { api } from '@/services'

export default class {
  private id = uuid()

  private text: IzabelaMessagePayload['text']

  private options: IzabelaMessagePayload['options']

  private audio = new Audio()

  private emitter = mitt()

  private audioDownloaded = new Deferred()

  private audioLoaded = new Deferred()

  constructor({ text, options }: IzabelaMessagePayload) {
    this.text = text
    this.options = options
    this.addEventListeners()
    this.downloadAudio()
      .then((data) => this.loadAudio(data))
      .catch((reason) => this.onError(reason))
  }

  downloadAudio() {
    return api.post('')
  }

  loadAudio(data: string) {
    console.log(data)
  }

  getAudioProgress() {
    return this.audio.currentTime / this.audio.duration
  }

  addEventListeners() {
    this.audio.addEventListener('canplaythrough', () => {
      this.emitter.emit('canplaythrough')
      this.audioLoaded.resolve(true)
    })
    this.audio.addEventListener('started', () => this.emitter.emit('started'))
    this.audio.addEventListener('ended', () => this.emitter.emit('ended'))
    this.audio.addEventListener('progress', () =>
      this.emitter.emit('progress', this.getAudioProgress()),
    )
    this.audio.addEventListener('error', (e) => this.onError(e))
  }

  on(event: IzabelaMessageEvent, callback: () => void): void {
    this.emitter.on(event, callback)
  }

  onError(e: Error) {
    this.emitter.emit('error')
    this.audioDownloaded.reject(e)
    this.audioLoaded.reject(e)
  }

  ready() {
    return Promise.all([this.audioDownloaded.promise, this.audioLoaded.promise])
  }
}
