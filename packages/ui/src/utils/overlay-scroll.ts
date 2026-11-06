const shieldSelector = '[data-nv-overlay-shield], [data-overlay-shield]'
const scrollableOverflow = /^(auto|scroll|overlay)$/
const lockedOverflow = /^(hidden|clip)$/

// A click shield is portalled outside the page's scroll containers. Wheel
// events must reach the scroller under the pointer without exposing clicks.
export function onOverlayShieldWheel(event: WheelEvent) {
  if (event.ctrlKey || event.defaultPrevented || !event.cancelable) return
  const shield = event.currentTarget
  if (!(shield instanceof HTMLElement)) return
  const doc = shield.ownerDocument
  const view = doc.defaultView
  if (!view) return
  const target =
    doc
      .elementsFromPoint(event.clientX, event.clientY)
      .find(
        (element): element is HTMLElement =>
          element instanceof HTMLElement &&
          !element.matches(shieldSelector) &&
          !element.contains(shield),
      ) || doc.scrollingElement
  if (!(target instanceof HTMLElement)) return

  let x = event.shiftKey && !event.deltaX ? event.deltaY : event.deltaX
  let y = event.shiftKey && !event.deltaX ? 0 : event.deltaY
  let converted = event.deltaMode === 0
  const bodyStyle = view.getComputedStyle(doc.body)
  for (
    let element: HTMLElement | null = target;
    element && (x || y);
    element = element.parentElement
  ) {
    const style = view.getComputedStyle(element)
    const root = element === doc.scrollingElement
    const overflowX = style.overflowX || style.overflow
    const overflowY = style.overflowY || style.overflow
    const scrollContainerX = root
      ? !lockedOverflow.test(overflowX) &&
        !lockedOverflow.test(bodyStyle.overflowX || bodyStyle.overflow)
      : scrollableOverflow.test(overflowX)
    const scrollContainerY = root
      ? !lockedOverflow.test(overflowY) &&
        !lockedOverflow.test(bodyStyle.overflowY || bodyStyle.overflow)
      : scrollableOverflow.test(overflowY)
    const canX = scrollContainerX && element.scrollWidth > element.clientWidth
    const canY = scrollContainerY && element.scrollHeight > element.clientHeight
    if (canX || canY) {
      if (!converted) {
        const line =
          parseFloat(style.lineHeight) || parseFloat(style.fontSize) || 16
        x *= event.deltaMode === 2 ? element.clientWidth : line
        y *= event.deltaMode === 2 ? element.clientHeight : line
        converted = true
      }
      const left = element.scrollLeft
      const top = element.scrollTop
      // Instant scrolling preserves wheel semantics even on smooth-scroll pages;
      // the browser owns bounds and RTL scrollLeft conventions.
      element.scrollTo({
        left: left + (canX ? x : 0),
        top: top + (canY ? y : 0),
        behavior: 'instant',
      })
      x -= element.scrollLeft - left
      y -= element.scrollTop - top
    }
    if (
      scrollContainerX &&
      /^(contain|none)$/.test(
        style.overscrollBehaviorX || style.overscrollBehavior,
      )
    )
      x = 0
    if (
      scrollContainerY &&
      /^(contain|none)$/.test(
        style.overscrollBehaviorY || style.overscrollBehavior,
      )
    )
      y = 0
  }
  // Do not also scroll the shield's own portal ancestors, or bubble through a
  // containing overlay and apply the same delta twice. Modal body locks remain.
  event.preventDefault()
  event.stopPropagation()
}
