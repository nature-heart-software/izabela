import { emitIPCProcessError } from '@/electron/events/renderer'
;(() => {
  window.addEventListener('error', (error: any) => {
    emitIPCProcessError({ name: error.name, message: error.message })
  })
})()
