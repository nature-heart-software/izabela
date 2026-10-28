import { v4 as uuid } from 'uuid'
import mitt from 'mitt'
import { Promise } from 'bluebird'
import { getEngineById } from '@/modules/speech-engine-manager'
import { getMediaDeviceByLabel } from '@/utils/media-devices'
import { useSettingsStore } from '@/features/settings/store'
import { blobToBase64, Deferred } from '@packages/toolbox'
import {
  useMessagesStore,
  usePlayingMessageStore,
} from '@/features/messages/store'
import { IzabelaMessageEvent, IzabelaMessagePayload } from './types'
import hash from 'object-hash'

type DownloadResponse = Blob | Response

export default (messagePayload: IzabelaMessagePayload) => {
  const {
    id: existingId,
    engine: engineName,
    excludeFromHistory,
    disableAutoplay,
    credentials,
    payload,
  } = messagePayload
  const id = existingId || uuid()
  const audio = new Audio()
  const emitter = mitt()
  const audioDownloaded = Deferred()
  const audioLoaded = Deferred()
  const playingMessageStore = usePlayingMessageStore()
  let audioElements: (HTMLAudioElement | null)[] = []
  let cancelled = false
  let finished = false
  // Both deferred promises can reject while a prefetched message is still queued.
  audioDownloaded.promise.catch(() => {})
  audioLoaded.promise.catch(() => {})
  if (!excludeFromHistory) {
    const messageStore = useMessagesStore()
    messageStore.$whenReady().then(() => {
      messageStore.addToHistory(id, messagePayload)
    })
  }

  function getEngine() {
    return getEngineById(engineName)
  }

  function getCacheId() {
    const engine = getEngine()
    const useCacheOnEveryRequest = !!engine?.getUseCacheOnEveryRequest()
    return `${useCacheOnEveryRequest ? 'cache' : id}-${hash(payload)}`
  }

  function on(
    event: IzabelaMessageEvent,
    callback: (...args: any[]) => void,
  ): void {
    emitter.on(event, callback)
  }

  function pause() {
    audio.pause()
  }

  function resume() {
    audio.play()
  }

  function cancel() {
    if (finished) return
    cancelled = true
    finished = true
    audio.pause()
    audioElements.forEach((audioEl) => audioEl?.pause())
    if (playingMessageStore.id === id)
      playingMessageStore.$patch({
        id: null,
        isPlaying: false,
        progress: 0,
      })
    audioDownloaded.resolve(false)
    audioLoaded.resolve(false)
    emitter.emit('ended')
  }

  function togglePlay() {
    if (audio.paused) {
      audio.play()
    } else {
      audio.pause()
    }
  }

  async function prepareAudioElements() {
    const settingsStore = useSettingsStore()
    return settingsStore
      .$whenReady()
      .then(() => {
        return Promise.map(
          settingsStore.audioOutputs,
          async (deviceLabel: string) => {
            let mediaDevice

            try {
              mediaDevice = await getMediaDeviceByLabel(deviceLabel)
            } catch (error) {
              console.error(error)
              return null
            }
            if (mediaDevice) {
              const audioElement: any = document.createElement('audio')

              try {
                await audioElement.setSinkId(mediaDevice.deviceId)
              } catch (error) {
                console.error(error)
                return null
              }
              return audioElement
            }
            return null
          },
        )
      })
      .then((resolvedAudioElements) => {
        audioElements = resolvedAudioElements
        return audioElements
      })
  }

  async function play() {
    const settingsStore = useSettingsStore()
    return settingsStore.$whenReady().then(() => {
      if (cancelled) return
      if (!settingsStore.playSpeechOnDefaultPlaybackDevice) {
        audio.volume = 0
      }
      return Promise.all([
        audio.play(),
        ...audioElements.map((audioEl) => audioEl?.play()),
      ])
    })
  }

  function isReady() {
    return Promise.all([audioDownloaded.promise, audioLoaded.promise])
  }

  async function createAudioSrc(res: DownloadResponse): Promise<string> {
    if (!('body' in res)) return URL.createObjectURL(res)
    const clonedResponse = res.clone()

    if (clonedResponse.headers.get('Content-Type') === 'audio/mpeg') {
      const mediaSource = new MediaSource()

      mediaSource.addEventListener('sourceopen', async () => {
        const sourceBuffer = mediaSource.addSourceBuffer('audio/mpeg')
        const reader = clonedResponse.body?.getReader()

        let queue: Uint8Array[] = []
        let processing = false

        async function pump() {
          if (processing || !reader) return
          const { done, value } = await reader.read()
          if (done) {
            if (!sourceBuffer.updating) {
              mediaSource.endOfStream()
            } else {
              sourceBuffer.addEventListener(
                'updateend',
                () => mediaSource.endOfStream(),
                { once: true },
              )
            }
            return
          }
          queue.push(value)
          processQueue()
        }

        function processQueue() {
          if (queue.length > 0 && !sourceBuffer.updating) {
            processing = true
            sourceBuffer.appendBuffer(queue.shift()!)
          }
        }

        sourceBuffer.addEventListener('updateend', () => {
          processing = false
          processQueue()
          if (!processing) pump()
        })

        await pump()
      })

      return URL.createObjectURL(mediaSource)
    }
    return URL.createObjectURL(await clonedResponse.blob())
  }

  async function downloadAudio(): Promise<DownloadResponse> {
    if (typeof window) {
      const { ElectronFilesystem } = window
      const cachedAudio = await ElectronFilesystem.getCachedAudio(getCacheId())
      if (cachedAudio) {
        const res = await fetch(cachedAudio)
        const blob = await res.blob()
        if (blob) {
          audioDownloaded.resolve(true)
          return Promise.resolve(blob)
        }
      }
    }

    let audioPromise: Promise<DownloadResponse>
    if (engineName === 'external-audio') {
      audioPromise = fetch(payload.url)
    } else {
      const engine = getEngine()
      if (!engine)
        return Promise.reject(
          new Error('Izabela Message: Selected engine was not found'),
        )
      audioPromise = engine.synthesizeSpeech({
        credentials,
        payload,
      })
    }
    return audioPromise.then((res) => {
      try {
        if (res instanceof Response) {
          const data = res.headers.get('data')
          if (data) emitter.emit('response:data', JSON.parse(data))
        }
      } catch (e) {
        console.error(e)
      }
      audioDownloaded.resolve(true)
      cacheAudio(res).catch(console.error)
      return Promise.resolve(res)
    })
  }

  async function cacheAudio(res: DownloadResponse) {
    if (typeof window !== 'undefined') {
      const { ElectronFilesystem } = window

      let base64 = ''
      if (!('body' in res)) {
        base64 = await blobToBase64(res)
      } else {
        const clonedResponse = res.clone()
        base64 = await blobToBase64(await clonedResponse.blob())
      }
      if (base64) {
        ElectronFilesystem.cacheAudio(getCacheId(), base64)
      }
    }
  }

  async function downloadAudioAndBlobify(): Promise<Blob> {
    return downloadAudio().then((res) => {
      if (!('body' in res)) return res
      const clonedResponse = res.clone()
      return clonedResponse.blob()
    })
  }

  async function loadAudio(res: DownloadResponse, audioEls = audioElements) {
    if (cancelled) return
    for (const audioElement of audioEls) {
      if (!audioElement) continue
      const src = await createAudioSrc(res)
      if (cancelled) {
        URL.revokeObjectURL(src)
        return
      }
      audioElement.src = src
      audioElement.load()
    }
    const src = await createAudioSrc(res)
    if (cancelled) {
      URL.revokeObjectURL(src)
      return
    }
    audio.src = src
    audio.load()
  }

  function getAudioProgress() {
    return audio.currentTime / audio.duration || 0
  }

  function addEventListeners() {
    audio.addEventListener('timeupdate', () => {
      if (finished) return
      emitter.emit('timeupdate', {
        currentTime: audio.currentTime,
        duration: audio.duration,
        progress: getAudioProgress(),
      })
      playingMessageStore.$patch({
        progress: getAudioProgress(),
      })
    })
    audio.addEventListener('ended', () => {
      if (finished) return
      playingMessageStore.$patch({
        id: null,
        isPlaying: false,
        progress: 0,
      })
    })
    audio.addEventListener('play', () => {
      if (finished) return
      playingMessageStore.$patch({
        id,
        isPlaying: true,
      })
    })
    audio.addEventListener('pause', () => {
      if (finished) return
      playingMessageStore.$patch({
        id,
        isPlaying: false,
      })
    })
    audio.addEventListener('canplaythrough', () => {
      emitter.emit('canplaythrough')
      audioLoaded.resolve(true)
    })
    audio.addEventListener('started', () => emitter.emit('started'))
    audio.addEventListener('ended', () => {
      if (finished) return
      finished = true
      emitter.emit('ended')
    })
    audio.addEventListener('error', (e) => onError(e))
  }

  function onError(e: ErrorEvent) {
    if (finished) return
    finished = true
    audio.pause()
    audioElements.forEach((audioEl) => audioEl?.pause())
    if (playingMessageStore.id === id)
      playingMessageStore.$patch({ id: null, isPlaying: false, progress: 0 })
    emitter.emit('error')
    audioDownloaded.reject(e)
    audioLoaded.reject(e)
  }

  function prepare() {
    addEventListeners()

    // Fetch both at the same time for efficiency
    Promise.all([downloadAudio(), prepareAudioElements()])
      .then(([res, audioEls]) => loadAudio(res, audioEls))
      .catch((reason) => onError(reason))
  }

  if (!disableAutoplay) {
    prepare()
  }

  return {
    id,
    isReady,
    play,
    on,
    downloadAudio,
    downloadAudioAndBlobify,
    pause,
    resume,
    cancel,
    togglePlay,
    getSocketPayload: () => {
      const { credentials: _, ...rest } = messagePayload
      return {
        ...rest,
        id,
        timestamp: new Date().toISOString(),
      }
    },
  }
}
