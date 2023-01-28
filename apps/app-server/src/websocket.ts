import { Server } from 'socket.io'

export default (() => {
  let io: Server | null = null
  const forwardEvent = (event: string, message: any) => {
    if (io) {
      io.emit(event, message)
    }
  }

  return {
    start({ port }: { port: number }) {
      io = new Server(port, {
        cors: {
          origin: '*',
          methods: ['*'],
        },
      })
      io.on('connect', (socket) => {
        console.log('[socket.io] Connected:', socket.id)
        socket.on('disconnect', () => {
          console.log('[socket.io] Disconnected:', socket.id)
        })
        ;[
          'message:load',
          'message:start',
          'message:end',
          'message:error',
        ].forEach((event) => {
          socket.on(event, (message) => forwardEvent(event, message))
        })
      })
    },
    forwardEvent,
  }
})()
