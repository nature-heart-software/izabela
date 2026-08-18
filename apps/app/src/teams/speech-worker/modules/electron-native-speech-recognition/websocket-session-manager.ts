import { WebSocket } from 'ws'

interface WebSocketSession {
  socket: WebSocket
  createdAt: number
}

export class WebSocketSessionManager {
  private primary: WebSocketSession | null = null
  private secondary: WebSocketSession | null = null
  private sessionMaxAge: number = 30 * 60 * 1000
  private primaryTimer: ReturnType<typeof setInterval> | null = null
  private secondaryTimer: ReturnType<typeof setInterval> | null = null
  private secondaryTimeout: ReturnType<typeof setTimeout> | null = null
  private readonly factory: () => Promise<WebSocket>

  constructor({
    factory,
    sessionMaxAge,
  }: {
    factory: () => Promise<WebSocket>
    sessionMaxAge?: number
  }) {
    this.factory = factory
    if (sessionMaxAge) {
      this.sessionMaxAge = sessionMaxAge
    }

    this.handleSessions()
  }

  getStaleAfter() {
    return this.sessionMaxAge * (2 / 3)
  }

  async handleSessions() {
    this.stop()

    this.primary = await this.createWebSocketSession()

    this.primaryTimer = setInterval(async () => {
      this.primary?.socket.close()
      this.primary = await this.createWebSocketSession()
    }, this.sessionMaxAge)

    this.secondaryTimeout = setTimeout(async () => {
      this.secondary?.socket.close()
      this.secondary = await this.createWebSocketSession()

      this.secondaryTimer = setInterval(async () => {
        this.secondary?.socket.close()
        this.secondary = await this.createWebSocketSession()
      }, this.sessionMaxAge)
    }, this.sessionMaxAge / 2)

    return this.primary
  }

  getActiveSession(): WebSocketSession | null {
    if (this.primary && !this.isStale(this.primary)) {
      return this.primary
    }

    if (this.secondary && !this.isStale(this.secondary)) {
      return this.secondary
    }

    return null
  }

  async createWebSocketSession(): Promise<WebSocketSession> {
    const socket = await this.factory()
    return new Promise((resolve, reject) => {
      socket.on('open', () => {
        resolve({
          socket,
          createdAt: Date.now(),
        })
      })
      socket.on('error', (err) => {
        reject(err)
      })
    })
  }

  public stop() {
    if (this.primaryTimer) clearInterval(this.primaryTimer)
    if (this.secondaryTimer) clearInterval(this.secondaryTimer)
    if (this.secondaryTimeout) clearTimeout(this.secondaryTimeout)
    this.primary?.socket.close()
    this.secondary?.socket.close()
  }

  private isStale(session: WebSocketSession): boolean {
    return Date.now() - session.createdAt > this.getStaleAfter()
  }
}
