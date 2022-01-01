import { throttle } from 'lodash'

const { ElectronMessengerWindow } = window

;(() => {
  {
    /* Toggles focus depending on whether the document is a mousemove target or not
     * Note: mousemove doesn't fire on transparent elements (here document)
     * if Hardware Acceleration is disabled (see fallback for solution)
     */

    /* This is necessary to make click-through work with Hardware Acceleration */
    const style = document.createElement('style')
    style.textContent = `body { pointer-events: none; } * { pointer-events: all; }`
    document.head.appendChild(style)

    /* Listen to mousemove and toggle focus */
    let focusable = false
    const focus = () => {
      if (!focusable) {
        focusable = true // Prevents from triggering multiple times causing perf issues
        ElectronMessengerWindow.focus()
      }
    }
    const blur = () => {
      if (focusable) {
        focusable = false // Prevents from triggering multiple times causing perf issues
        ElectronMessengerWindow.blur()
      }
    }
    /* blur once by default */
    blur()
    window.addEventListener(
      'mousemove',
      throttle((event: MouseEvent) => {
        if (event.target === document.documentElement) {
          blur()
        } else {
          focus()
        }
      }, 150),
    )

    if (process.env.NODE_ENV === 'development') {
      /* Fallback in case Hardware Acceleration is disabled
       * disableMouseEvents() will be called on window blur instead
       * (elements that are not transparent still trigger mousemove (focus))
       */
      window.addEventListener('blur', () => {
        blur()
      })
    }
  }

  {
    /* Fixes focus because for some reasons it doesn't work */
    window.addEventListener('click', (event) => {
      const target = event.target as HTMLElement
      const closestFocusable = target.closest(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      ) as HTMLElement | null

      const activeEl = document.activeElement as HTMLElement
      if (activeEl) activeEl.blur()
      if (closestFocusable) return closestFocusable.focus()
      return target.focus()

      // const selection = window.getSelection()
      // if (selection) {
      //   selection.removeAllRanges()
      //   selection.addRange(document.caretRangeFromPoint(event.clientX, event.clientY) as Range)
      // }
    })
    window.addEventListener('blur', () => {
      const activeEl = document.activeElement as HTMLElement
      if (activeEl) activeEl.blur()
    })
  }
})()
