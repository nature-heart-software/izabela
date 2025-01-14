import '@/modules/electron-log/renderer'

import { onIPCGameOverlayResize } from '@/electron/events/renderer.ts'

onIPCGameOverlayResize(({ width, height }) => {
  const appEl = document.getElementById('app')
  appEl.style.width = width+'px'
  appEl.style.height = height+'px'
})
