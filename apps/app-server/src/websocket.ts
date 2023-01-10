import { Server } from 'socket.io'

export default (() => {
  let io: Server | null = null
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
      })
    },
    sendMessage(message: { id: string; text: string; timestamp: string }) {
      if (io) {
        io.emit('message', message)
      }
    },
  }
})()
