import { throttle } from 'lodash'

const { ElectronMessengerWindow } = window

;(() => {
  let t
  let focused = true
  const enableMouseEvents = () => {
    if (!focused) {
      focused = true // Prevents from triggering multiple times causing perf issues
      ElectronMessengerWindow.focus()
    }
  }
  const disableMouseEvents = () => {
    if (focused) {
      focused = false // Prevents from triggering multiple times causing perf issues
      ElectronMessengerWindow.blur()
    }
  }
  window.addEventListener(
    'mousemove',
    throttle((event: MouseEvent) => {
      if (event.target === document.documentElement) {
        disableMouseEvents()
        // if (t) clearTimeout(t)
        // t = setTimeout(function() {
        //     enableMouseEvents()
        // }, 600)
      } else {
        enableMouseEvents()
      }
    }, 150),
  )
})()
