import { emitIPCProcessError } from '@/electron/events/renderer'

const { addEventListener } = window
;(() => {
  addEventListener('error', (error: any) => {
    emitIPCProcessError({ name: error.name, message: error.message })
  })
})()
