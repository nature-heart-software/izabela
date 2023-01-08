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
      io.on('connection', (socket) => {
        console.log('[socket.io] Connection:', socket.id)
      })
    },
    sendMessage(message: { id: string; text: string; timestamp: string }) {
      if (io) {
        io.emit('message', message)
      }
    },
  }
})()
