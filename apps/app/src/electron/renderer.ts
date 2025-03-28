import '@/modules/electron-log/renderer'

import { onIPCGameOverlayResize } from '@/electron/events/renderer.ts'

onIPCGameOverlayResize(({ width, height }) => {
  const appEl = document.getElementById('app')
  if (appEl) {
    appEl.style.position = 'relative'
    appEl.style.width = width + 'px'
    appEl.style.height = height + 'px'
  }
})
