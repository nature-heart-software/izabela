import { v4 as uuid } from 'uuid'
import mitt from 'mitt'
import { Deferred } from '@/utils/promise'
import store from '@/store'
import { Promise } from 'bluebird'
import speechEngineManager from '@/entities/speech/modules/speech-engine-manager'
import { getMediaDeviceByLabel } from '@/utils/media-devices'
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
      .then(({ data }) => {
        this.audioDownloaded.resolve(true)
        this.loadAudio(data)
      })
      .catch((reason) => this.onError(reason))
  }

  public on(event: IzabelaMessageEvent, callback: () => void): void {
    this.emitter.on(event, callback)
  }

  public play() {
    Promise.map(
      store.getters['settings/persisted'].audioOutputDevices,
      async (deviceLabel: string) => {
        // TODO: Some optimisation possible here
        const mediaDevice = await getMediaDeviceByLabel(deviceLabel)
        if (mediaDevice) {
          const audioElement: any = document.createElement('audio')
          audioElement.src = this.audio.src
          await audioElement.setSinkId(mediaDevice.deviceId)
          return audioElement
        }
        return null
      },
    ).then((audioElements: (HTMLAudioElement | null)[]) => {
      if (!store.getters['settings/persisted'].playSpeechOnDefaultPlaybackDevice) {
        this.audio.volume = 0
      }
      this.audio.play()
      audioElements.forEach((audio) => audio && audio.play())
    })
  }

  public ready() {
    return Promise.all([this.audioDownloaded.promise, this.audioLoaded.promise])
  }

  private downloadAudio() {
    // TODO: change depending on engine
    const engine = speechEngineManager.getEngineById(this.engine)
    if (!engine)
      return Promise.reject(new Error('Izabela Message: Selected engine was   not found'))
    return engine.synthesizeSpeech({
      credentials: this.credentials,
      payload: this.payload,
    })
  }

  private loadAudio(blob: Blob) {
    this.audio.src = URL.createObjectURL(blob)
    this.audio.load()
  }

  private getAudioProgress() {
    return this.audio.currentTime / this.audio.duration
  }

  private addEventListeners() {
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

  private onError(e: ErrorEvent) {
    this.emitter.emit('error')
    this.audioDownloaded.reject(e)
    this.audioLoaded.reject(e)
  }
}
