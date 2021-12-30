import { throttle } from 'lodash'

const { ElectronMessengerWindow } = window

;(() => {
  // let t
  let focusable = true
  const enableMouseEvents = () => {
    if (!focusable) {
      focusable = true // Prevents from triggering multiple times causing perf issues
      ElectronMessengerWindow.focus()
    }
  }
  const disableMouseEvents = () => {
    if (focusable) {
      focusable = false // Prevents from triggering multiple times causing perf issues
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

  if (process.env.NODE_ENV === 'development') {
    /* This fixes focus on initial click since there's no hardware acceleration in dev
     * Mouse events aren't fired in a transparent background due to HA being disabled :c
     */
    disableMouseEvents()
    window.addEventListener('blur', () => {
      disableMouseEvents()
    })
  }
})()
