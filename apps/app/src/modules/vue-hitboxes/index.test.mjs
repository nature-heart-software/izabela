import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { JSDOM } from 'jsdom'
import { nextTick, ref } from 'vue'
import loadTypescript from '../../../../../tests/load-typescript.cjs'

const filename = fileURLToPath(new URL('./index.ts', import.meta.url))
const settle = async () => {
  await new Promise(setImmediate)
  await nextTick()
}

function fixture(t, gameOverlay = false) {
  const dom = new JSDOM('<!doctype html><html><body></body></html>')
  t.after(() => dom.window.close())
  const { window } = dom
  const active = new Set()
  class Observer {
    constructor(callback) {
      this.callback = callback
      this.elements = new Set()
    }
    observe(element) {
      this.elements.add(element)
      active.add(this)
    }
    disconnect() {
      this.elements.clear()
      active.delete(this)
    }
  }
  const hitboxes = new Map()
  const writes = []
  const store = {
    addHitbox(value) {
      writes.push(value)
      hitboxes.set(value.id, value)
    },
    removeHitbox(id) {
      hitboxes.delete(id)
    },
  }
  const listeners = new Map()
  const add = window.addEventListener.bind(window)
  window.addEventListener = (event, callback, ...args) => {
    if (!listeners.has(event)) listeners.set(event, new Set())
    listeners.get(event).add(callback)
    return add(event, callback, ...args)
  }
  const pixelRatio = ref(1)
  let pixelRatioSubscriptions = 0
  let nextId = 0
  const tracker = loadTypescript(
    filename,
    {
      uuid: { v4: () => String(++nextId) },
      '@/consts.ts': { isGameOverlay: gameOverlay },
      '@/modules/vue-hitboxes/hitboxes.store': {
        hitboxStoreSessionId: 'renderer-session',
        useHitboxesStore: () => store,
      },
      '@vueuse/core': {
        useDevicePixelRatio() {
          pixelRatioSubscriptions++
          return { pixelRatio }
        },
      },
    },
    {
      window,
      document: window.document,
      MutationObserver: window.MutationObserver,
      ResizeObserver: Observer,
      IntersectionObserver: Observer,
    },
  )
  const element = (className = 'hitbox') => {
    const node = window.document.createElement('div')
    node.className = className
    node.getBoundingClientRect = () => ({ x: 10, y: 20, width: 30, height: 40 })
    return node
  }
  return {
    ...tracker,
    window,
    document: window.document,
    active,
    hitboxes,
    writes,
    listeners,
    pixelRatio,
    subscriptions: () => pixelRatioSubscriptions,
    element,
  }
}

test('removing a subtree releases observers, hitboxes and pending updates', async (t) => {
  const f = fixture(t)
  const parent = f.element('parent')
  parent.append(f.element(), f.element())
  f.document.body.append(parent)
  await settle()
  assert.equal(f.hitboxes.size, 2)
  assert.equal(f.active.size, 4)
  // Schedule trailing work, then remove the nodes before it runs.
  f.window.dispatchEvent(new f.window.Event('resize'))
  parent.remove()
  await settle()
  assert.equal(f.hitboxes.size, 0)
  assert.equal(f.active.size, 0)
  const writes = f.writes.length
  await new Promise((resolve) => setTimeout(resolve, 300))
  assert.equal(
    f.writes.length,
    writes,
    'removed nodes cannot republish hitboxes',
  )
})

test('a detached popover is tracked again when the same DOM node is reused', async (t) => {
  const f = fixture(t)
  f.watchHitbox('.tippy-box')
  const node = f.element('tippy-box')
  f.document.body.append(node)
  await settle()
  const firstId = [...f.hitboxes.keys()][0]
  assert.ok(firstId)
  node.remove()
  await settle()
  assert.equal(f.hitboxes.size, 0)
  f.document.body.append(node)
  await settle()
  assert.equal(f.hitboxes.size, 1)
  assert.equal(f.active.size, 2)
  assert.notEqual([...f.hitboxes.keys()][0], firstId)
})

test('moving or matching several selectors does not duplicate active hitboxes', async (t) => {
  const f = fixture(t)
  f.watchHitbox('.tippy-box')
  f.watchHitbox('.tippy-box')
  const node = f.element('hitbox tippy-box')
  const target = f.element('target')
  f.document.body.append(node, target)
  await settle()
  const firstId = [...f.hitboxes.keys()][0]
  target.append(node)
  await settle()
  assert.deepEqual([...f.hitboxes.keys()], [firstId])
  assert.equal(f.active.size, 2)
  assert.equal(f.subscriptions(), 1)
})

test('repeated mounts keep global listeners and pixel-ratio subscriptions bounded', async (t) => {
  const f = fixture(t)
  const initial = f.element()
  f.document.body.append(initial)
  await settle()
  initial.remove()
  await settle()
  const resizeListeners = f.listeners.get('resize').size
  const focusListeners = f.listeners.get('focus').size
  for (let count = 0; count < 20; count++) {
    const node = f.element()
    f.document.body.append(node)
    await settle()
    node.remove()
    await settle()
  }
  assert.equal(f.listeners.get('resize').size, resizeListeners)
  assert.equal(f.listeners.get('focus').size, focusListeners)
  assert.equal(f.subscriptions(), 1)
  assert.equal(f.hitboxes.size, 0)
  assert.equal(f.active.size, 0)
})

test('existing elements and display-scale changes publish current native bounds', async (t) => {
  const f = fixture(t)
  const node = f.element('autocomplete')
  f.document.body.append(node)
  f.watchHitbox('.autocomplete')
  assert.equal(f.hitboxes.size, 1)
  assert.deepEqual(
    { ...[...f.hitboxes.values()][0] },
    { id: '1', sessionId: 'renderer-session', x: 10, y: 20, w: 30, h: 40 },
  )
  f.pixelRatio.value = 2
  await nextTick()
  await new Promise((resolve) => setTimeout(resolve, 300))
  assert.deepEqual(
    { ...[...f.hitboxes.values()][0] },
    { id: '1', sessionId: 'renderer-session', x: 20, y: 40, w: 60, h: 80 },
  )
})

test('the game-overlay renderer does not subscribe or create desktop hitboxes', async (t) => {
  const f = fixture(t, true)
  f.watchHitbox('.tippy-box')
  f.document.body.append(f.element(), f.element('tippy-box'))
  await settle()
  assert.equal(f.subscriptions(), 0)
  assert.equal(f.listeners.size, 0)
  assert.equal(f.hitboxes.size, 0)
  assert.equal(f.active.size, 0)
})
