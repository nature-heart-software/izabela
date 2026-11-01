import { WebSocket } from 'ws'

interface WebSocketSession {
  socket: WebSocket
  createdAt: number
}

export class WebSocketSessionManager {
  private primary: WebSocketSession | null = null
  private secondary: WebSocketSession | null = null
  private pending = new Map<string, Promise<WebSocketSession | null>>()
  private cancelPending = new Set<() => void>()
  private stopped = false
  private timers: ReturnType<typeof setInterval>[] = []
  private readonly factory: () => Promise<WebSocket>
  private readonly sessionMaxAge: number
  private readonly connectionTimeout: number
  public readonly ready: Promise<WebSocketSession | null>

  constructor({
    factory,
    sessionMaxAge = 30 * 60 * 1000,
    connectionTimeout = 15000,
  }: {
    factory: () => Promise<WebSocket>
    sessionMaxAge?: number
    connectionTimeout?: number
  }) {
    this.factory = factory
    this.sessionMaxAge = sessionMaxAge
    this.connectionTimeout = connectionTimeout
    this.ready = this.refresh('primary')
    this.timers.push(
      setInterval(() => {
        void this.refresh('primary')
      }, sessionMaxAge),
    )
    const stagger = setTimeout(() => {
      if (this.stopped) return
      void this.refresh('secondary')
      this.timers.push(
        setInterval(() => {
          void this.refresh('secondary')
        }, sessionMaxAge),
      )
    }, sessionMaxAge / 2)
    this.timers.push(stagger)
  }

  getStaleAfter() {
    return this.sessionMaxAge * (2 / 3)
  }

  getActiveSession(): WebSocketSession | null {
    if (this.stopped) return null
    return (
      [this.primary, this.secondary].find(
        (session) =>
          session &&
          session.socket.readyState === WebSocket.OPEN &&
          Date.now() - session.createdAt <= this.getStaleAfter(),
      ) || null
    )
  }

  async getSession(): Promise<WebSocketSession | null> {
    if (this.stopped) return null
    return this.getActiveSession() || this.refresh('primary')
  }

  private refresh(
    slot: 'primary' | 'secondary',
  ): Promise<WebSocketSession | null> {
    if (this.stopped) return Promise.resolve(null)
    const existing = this.pending.get(slot)
    if (existing) return existing
    const request = this.createWebSocketSession()
      .then((session) => {
        if (this.stopped) {
          session.socket.close()
          return null
        }
        const previous = this[slot]
        this[slot] = session
        previous?.socket.close()
        return session
      })
      .catch((error) => {
        if (!this.stopped)
          console.error('Unable to establish transcription session', error)
        return null
      })
      .finally(() => {
        this.pending.delete(slot)
      })
    this.pending.set(slot, request)
    return request
  }

  private createWebSocketSession(): Promise<WebSocketSession> {
    return new Promise((resolve, reject) => {
      let socket: WebSocket | undefined
      let settled = false
      const finish = (error?: Error) => {
        if (settled) return
        settled = true
        clearTimeout(timeout)
        this.cancelPending.delete(cancel)
        socket?.off('open', onOpen)
        socket?.off('close', onClose)
        socket?.off('error', onError)
        if (error) {
          socket?.close()
          reject(error)
        } else resolve({ socket: socket!, createdAt: Date.now() })
      }
      const onOpen = () => finish()
      const onClose = () =>
        finish(new Error('Transcription connection closed before opening'))
      const onError = (error: Error) => finish(error)
      const cancel = () => finish(new Error('Transcription session stopped'))
      const timeout = setTimeout(
        () => finish(new Error('Transcription connection timed out')),
        this.connectionTimeout,
      )
      this.cancelPending.add(cancel)
      Promise.resolve()
        .then(() => {
          if (settled || this.stopped)
            throw new Error('Transcription session stopped')
          return this.factory()
        })
        .then((created) => {
          socket = created
          // ws emits an error when a CONNECTING socket is closed during teardown.
          socket.on('error', () => {})
          if (settled || this.stopped) {
            socket.close()
            return
          }
          socket.on('open', onOpen)
          socket.on('close', onClose)
          socket.on('error', onError)
          if (socket.readyState === WebSocket.OPEN) finish()
          else if (socket.readyState !== WebSocket.CONNECTING) onClose()
        })
        .catch(onError)
    })
  }

  public stop() {
    if (this.stopped) return
    this.stopped = true
    this.timers.forEach((timer) => clearTimeout(timer))
    this.timers = []
    this.cancelPending.forEach((cancel) => cancel())
    this.primary?.socket.close()
    this.secondary?.socket.close()
    this.primary = this.secondary = null
  }
}
