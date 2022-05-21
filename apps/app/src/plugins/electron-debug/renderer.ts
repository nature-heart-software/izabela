const { ipc } = window
;(() => {
  window.addEventListener('error', (error: any) => {
    ipc.sendTo('main', 'error', { name: error.name, message: error.message })
  })
})()
