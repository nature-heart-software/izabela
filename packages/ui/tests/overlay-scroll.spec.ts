// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { onOverlayShieldWheel } from '../src/utils/overlay-scroll'

const hitTest = Object.getOwnPropertyDescriptor(document, 'elementsFromPoint')
const scrollingElement = Object.getOwnPropertyDescriptor(
  document,
  'scrollingElement',
)
const rootStyle = document.documentElement.getAttribute('style')
afterEach(() => {
  document.body.innerHTML = ''
  document.body.removeAttribute('style')
  for (const [key, descriptor] of [
    ['elementsFromPoint', hitTest],
    ['scrollingElement', scrollingElement],
  ] as const) {
    if (descriptor) Object.defineProperty(document, key, descriptor)
    else Reflect.deleteProperty(document, key)
  }
  for (const key of [
    'clientWidth',
    'clientHeight',
    'scrollWidth',
    'scrollHeight',
    'scrollTo',
  ])
    Reflect.deleteProperty(document.documentElement, key)
  document.documentElement.scrollTop = 0
  document.documentElement.scrollLeft = 0
  if (rootStyle === null) document.documentElement.removeAttribute('style')
  else document.documentElement.setAttribute('style', rootStyle)
})

function scroller(element: HTMLElement = document.createElement('div')) {
  element.style.overflowX = element.style.overflowY = 'auto'
  element.style.lineHeight = '24px'
  Object.defineProperties(element, {
    clientHeight: { value: 200, configurable: true },
    scrollHeight: { value: 1000, configurable: true },
    clientWidth: { value: 200, configurable: true },
    scrollWidth: { value: 1000, configurable: true },
    scrollTo: {
      configurable: true,
      value: ({ top, left }: ScrollToOptions) => {
        if (top !== undefined)
          element.scrollTop = Math.max(
            0,
            Math.min(element.scrollHeight - element.clientHeight, top),
          )
        if (left !== undefined)
          element.scrollLeft = Math.max(
            0,
            Math.min(element.scrollWidth - element.clientWidth, left),
          )
      },
    },
  })
  return element
}
function fixture() {
  const page = scroller()
  const leaf = document.createElement('button')
  page.append(leaf)
  const shield = document.createElement('div')
  shield.dataset.nvOverlayShield = ''
  shield.addEventListener('wheel', onOverlayShieldWheel)
  document.body.append(page, shield)
  Object.defineProperty(document, 'elementsFromPoint', {
    configurable: true,
    value: () => [shield, leaf, page, document.body, document.documentElement],
  })
  const wheel = (options: WheelEventInit = {}) => {
    const event = new WheelEvent('wheel', {
      deltaY: 60,
      clientX: 10,
      clientY: 20,
      bubbles: true,
      cancelable: true,
      ...options,
    })
    shield.dispatchEvent(event)
    return event
  }
  return { page, leaf, shield, wheel }
}

describe('wheel routing through an overlay click shield', () => {
  it('chains only the unconsumed delta to the next scroll ancestor', () => {
    const f = fixture()
    const inner = scroller()
    inner.append(f.leaf)
    f.page.append(inner)
    inner.scrollTop = 790
    f.wheel({ deltaY: 60 })
    expect(inner.scrollTop).toBe(800)
    expect(f.page.scrollTop).toBe(50)
  })
  it('chains negative deltas from a nested scroller at its top', () => {
    const f = fixture()
    const inner = scroller()
    inner.append(f.leaf)
    f.page.append(inner)
    inner.scrollTop = 10
    f.page.scrollTop = 100
    f.wheel({ deltaY: -60 })
    expect(inner.scrollTop).toBe(0)
    expect(f.page.scrollTop).toBe(50)
  })
  it('honors overscroll containment at the inner scroll boundary', () => {
    const f = fixture()
    const inner = scroller()
    inner.style.overscrollBehaviorY = 'contain'
    inner.append(f.leaf)
    f.page.append(inner)
    inner.scrollTop = 800
    f.wheel()
    expect(inner.scrollTop).toBe(800)
    expect(f.page.scrollTop).toBe(0)
  })
  it.each(
    ['auto', 'scroll'].flatMap((overflow) =>
      ['contain', 'none'].flatMap((policy) =>
        [200, 1000].map((scrollWidth) => ({ overflow, policy, scrollWidth })),
      ),
    ),
  )(
    'honors $policy at a zero-range $overflow vertical boundary with scrollWidth=$scrollWidth',
    ({ overflow, policy, scrollWidth }) => {
      const f = fixture()
      const inner = scroller()
      inner.style.overflowX = inner.style.overflowY = overflow
      inner.style.overscrollBehaviorY = policy
      Object.defineProperties(inner, {
        scrollHeight: { value: inner.clientHeight, configurable: true },
        scrollWidth: { value: scrollWidth, configurable: true },
      })
      inner.append(f.leaf)
      f.page.append(inner)
      const event = f.wheel()
      expect(f.page.scrollTop).toBe(0)
      expect(inner.scrollTop).toBe(0)
      expect(inner.scrollLeft).toBe(0)
      expect(event.defaultPrevented).toBe(true)
    },
  )
  it.each([
    { mode: 1, delta: 3, expected: 24 * 3 },
    { mode: 2, delta: 1, expected: 200 },
  ])('normalizes wheel units in mode $mode', ({ mode, delta, expected }) => {
    const f = fixture()
    f.wheel({ deltaMode: mode, deltaX: delta, deltaY: delta })
    expect(f.page.scrollTop).toBe(expected)
    expect(f.page.scrollLeft).toBe(expected)
  })
  it('supports shift-wheel horizontal scrolling', () => {
    const f = fixture()
    f.wheel({ shiftKey: true })
    expect(f.page.scrollLeft).toBe(60)
    expect(f.page.scrollTop).toBe(0)
  })
  it('looks beneath every nested click shield without redispatching wheel events', () => {
    const f = fixture()
    const parentShield = document.createElement('div')
    parentShield.dataset.overlayShield = 'popover'
    document.body.append(parentShield)
    Object.defineProperty(document, 'elementsFromPoint', {
      configurable: true,
      value: () => [f.shield, parentShield, f.leaf, f.page, document.body],
    })
    let received = 0
    f.leaf.addEventListener('wheel', () => received++)
    f.wheel()
    expect(f.page.scrollTop).toBe(60)
    expect(received).toBe(0)
  })
  it('preserves modal body scroll locks while allowing a dialog-local scroller', () => {
    const f = fixture()
    const root = scroller(document.documentElement)
    Object.defineProperty(document, 'scrollingElement', {
      configurable: true,
      value: root,
    })
    document.body.style.overflowX = document.body.style.overflowY = 'hidden'
    f.page.style.overflowX = f.page.style.overflowY = 'visible'
    f.wheel()
    expect(root.scrollTop).toBe(0)
    f.page.style.overflowX = f.page.style.overflowY = 'auto'
    f.wheel()
    expect(f.page.scrollTop).toBe(60)
    expect(root.scrollTop).toBe(0)
  })
  it('allows unlocked document scrolling without a second native default scroll', () => {
    const f = fixture()
    const root = scroller(document.documentElement)
    Object.defineProperty(document, 'scrollingElement', {
      configurable: true,
      value: root,
    })
    f.page.style.overflowX = f.page.style.overflowY = 'visible'
    expect(f.wheel().defaultPrevented).toBe(true)
    expect(root.scrollTop).toBe(60)
  })
  it.each([{ ctrlKey: true }, { cancelable: false }])(
    'leaves zoom and noncancelable wheel events to the browser: %j',
    (options) => {
      const f = fixture()
      expect(f.wheel(options).defaultPrevented).toBe(false)
      expect(f.page.scrollTop).toBe(0)
    },
  )
})
