import { v4 as uuid } from 'uuid'
import mitt from 'mitt'
import { Deferred } from '@/utils/deferred'
import { api } from '@/services'
import store from '@/store'
import { decrypt } from '@/utils/security'
import { IzabelaMessageEvent, IzabelaMessagePayload } from './types'

export default class {
  private id = uuid()

  private engine: IzabelaMessagePayload['engine']

  private payload: IzabelaMessagePayload['payload']

  private credentials: IzabelaMessagePayload['credentials']

  private audio = new Audio()

  private emitter = mitt()

  private audioDownloaded = new Deferred()

  private audioLoaded = new Deferred()

  constructor({ engine, payload, credentials }: IzabelaMessagePayload) {
    this.engine = engine
    this.payload = payload
    this.credentials = credentials
    this.addEventListeners()
    this.downloadAudio()
      .then(({ data }) => this.loadAudio(data))
      .catch((reason) => this.onError(reason))
  }

  downloadAudio() {
    // TODO: change depending on engine
    return api.post<string>('/tts/google-cloud/synthesize-speech', {
      credentials: { apikey: decrypt(store.getters['settings/persisted'].GCTTSApiKey) },
      payload: this.payload,
    })
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

  onError(e: ErrorEvent) {
    this.emitter.emit('error')
    this.audioDownloaded.reject(e)
    this.audioLoaded.reject(e)
  }

  ready() {
    return Promise.all([this.audioDownloaded.promise, this.audioLoaded.promise])
  }
}
