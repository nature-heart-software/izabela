import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// Connect to an explicitly started local browser; create and close only our tab.
const browserUrl = process.env.UI_BROWSER_CDP_URL || 'http://127.0.0.1:9222'
const storybookUrl = process.env.UI_STORYBOOK_URL || 'http://127.0.0.1:6006'
const output = fileURLToPath(
  new URL('../../../coverage/ui-browser', import.meta.url),
)
await mkdir(output, { recursive: true })
const report = {
  status: 'failed',
  browserExecuted: false,
  nativeInputExecuted: false,
  journeys: [],
}
await writeFile(resolve(output, 'report.json'), JSON.stringify(report, null, 2))
let target
let socket
let sequence = 0
const pending = new Map()
const errors = []
const delay = (ms) => new Promise((done) => setTimeout(done, ms))
async function request(path, options = {}) {
  const response = await fetch(new URL(path, browserUrl), {
    ...options,
    signal: AbortSignal.timeout(10000),
  })
  if (!response.ok)
    throw new Error(`Browser endpoint returned ${response.status}`)
  return response
}
function call(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++sequence
    const timer = setTimeout(() => {
      pending.delete(id)
      reject(new Error(`Timed out: ${method}`))
    }, 10000)
    pending.set(id, { resolve, reject, timer })
    socket.send(JSON.stringify({ id, method, params }))
  })
}
async function evaluate(expression) {
  const value = await call('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true,
  })
  if (value.exceptionDetails)
    throw new Error(
      value.exceptionDetails.exception?.description ||
        value.exceptionDetails.text,
    )
  return value.result?.value
}
async function waitFor(expression) {
  const end = Date.now() + 15000
  while (Date.now() < end) {
    try {
      if (await evaluate(expression)) return
    } catch {}
    await delay(100)
  }
  throw new Error(`Page condition not reached: ${expression}`)
}
async function story(id) {
  const url = new URL('/iframe.html', storybookUrl)
  url.searchParams.set('id', id)
  url.searchParams.set('viewMode', 'story')
  await call('Page.navigate', { url: url.href })
  await waitFor(
    'document.readyState === "complete" && Boolean(document.querySelector("#storybook-root")?.childElementCount)',
  )
  await evaluate('document.fonts.ready.then(() => true)')
  await delay(150)
  errors.length = 0
}
async function point(selector) {
  return evaluate(
    `(() => { const e=document.querySelector(${JSON.stringify(
      selector,
    )}); if(!e) throw Error('Missing target'); const r=e.getBoundingClientRect(); if(!r.width||!r.height) throw Error('Hidden target'); return {x:r.x+r.width/2,y:r.y+r.height/2}; })()`,
  )
}
async function pointer(type, position) {
  await call('Input.dispatchMouseEvent', {
    type,
    ...position,
    button: type === 'mouseMoved' ? 'none' : 'left',
    buttons: type === 'mousePressed' ? 1 : 0,
    clickCount: 1,
  })
  report.nativeInputExecuted = true
}
async function click(selector) {
  const position = await point(selector)
  for (const type of ['mouseMoved', 'mousePressed', 'mouseReleased'])
    await pointer(type, position)
  await delay(250)
}
async function key(key, code, virtualKey) {
  for (const type of ['keyDown', 'keyUp'])
    await call('Input.dispatchKeyEvent', {
      type,
      key,
      code,
      windowsVirtualKeyCode: virtualKey,
    })
  report.nativeInputExecuted = true
  await delay(200)
}
async function check(name, expression, expected) {
  const actual = await evaluate(expression)
  assert.deepEqual(actual, expected, name)
}
async function journey(name, run) {
  try {
    await run()
    assert.deepEqual(errors, [], 'No uncaught browser errors')
    report.journeys.push({ name, status: 'passed' })
  } catch (error) {
    report.journeys.push({
      name,
      status: 'failed',
      error: String(error.stack || error),
    })
    const image = await call('Page.captureScreenshot', { format: 'png' }).catch(
      () => null,
    )
    if (image)
      await writeFile(
        resolve(output, `${name}.png`),
        Buffer.from(image.data, 'base64'),
      )
  }
}
try {
  target = await (
    await request('/json/new?about:blank', { method: 'PUT' })
  ).json()
  socket = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error('Browser WebSocket did not open')),
      10000,
    )
    socket.addEventListener(
      'open',
      () => {
        clearTimeout(timer)
        resolve()
      },
      { once: true },
    )
    socket.addEventListener(
      'error',
      () => {
        clearTimeout(timer)
        reject(new Error('Browser WebSocket failed'))
      },
      { once: true },
    )
  })
  socket.addEventListener('message', ({ data }) => {
    const message = JSON.parse(data)
    if (message.method === 'Runtime.exceptionThrown')
      errors.push(message.params.exceptionDetails.text)
    const task = pending.get(message.id)
    if (!task) return
    clearTimeout(task.timer)
    pending.delete(message.id)
    if (message.error) task.reject(new Error(message.error.message))
    else task.resolve(message.result)
  })
  await call('Page.enable')
  await call('Runtime.enable')
  await call('Emulation.setDeviceMetricsOverride', {
    width: 1100,
    height: 800,
    deviceScaleFactor: 1,
    mobile: false,
  })
  report.browserExecuted = true
  await journey('keyboard-and-theme', async () => {
    await story('button--default')
    await check(
      'Default geometry',
      "getComputedStyle(document.querySelector('#storybook-root button')).height",
      '32px',
    )
    await check(
      'Default theme',
      "getComputedStyle(document.querySelector('#storybook-root button')).backgroundColor",
      'rgb(51, 51, 51)',
    )
    await story('switch--default')
    await key('Tab', 'Tab', 9)
    await check(
      'Keyboard focus',
      "document.activeElement.getAttribute('role')",
      'switch',
    )
    const before = await evaluate(
      "document.activeElement.getAttribute('aria-checked')",
    )
    await key(' ', 'Space', 32)
    assert.notEqual(
      await evaluate(
        "document.querySelector('[role=switch]').getAttribute('aria-checked')",
      ),
      before,
    )
  })
  await journey('loading-styles', async () => {
    await call('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }],
    })
    await story('integration-overlays--loading')
    await check(
      'Named loading status',
      "document.querySelector('[data-test=loading-host] [role=status]').getAttribute('aria-label')",
      'Loading',
    )
    assert.equal(
      await evaluate(
        "(() => {let e=document.querySelector('[role=status] > svg'),s=getComputedStyle(e);return e.getBoundingClientRect().width>0&&e.getBoundingClientRect().height>0&&s.animationName!=='none'&&getComputedStyle(e.querySelector('circle')).animationName==='nv-loading-dash'})()",
      ),
      true,
    )
    const sample = () =>
      evaluate(
        "[...document.querySelectorAll('[role=status] > svg')].map(e=>({rotation:getComputedStyle(e).transform,arc:getComputedStyle(e.querySelector('circle')).strokeDasharray,offset:getComputedStyle(e.querySelector('circle')).strokeDashoffset}))",
      )
    const samples = [await sample()]
    // The arc holds its longest length for half a cycle. Sample beyond that
    // interval so the assertion does not depend on the initial animation phase.
    for (let frame = 0; frame < 4; frame++) {
      await delay(220)
      samples.push(await sample())
    }
    assert.equal(
      samples[0].length,
      3,
      'Both loading modes and the select render',
    )
    for (let index = 0; index < 3; index++) {
      for (const property of ['rotation', 'arc', 'offset']) {
        assert.ok(
          new Set(samples.map((frame) => frame[index][property])).size > 1,
          `Spinner ${index} changes ${property}`,
        )
      }
    }
    await call('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
    })
    await delay(50)
    await check(
      'Reduced motion stops rotation and arc animation',
      "[...document.querySelectorAll('[role=status] > svg, [role=status] > svg > circle')].map(e=>getComputedStyle(e).animationName)",
      Array(6).fill('none'),
    )
    await call('Emulation.setEmulatedMedia', { features: [] })
  })
  await journey('disabled-select', async () => {
    await story('integration-overlays--disabled-select')
    await check(
      'Native disabled and naming',
      "(() => {let e=document.querySelector('#storybook-root input');return {disabled:e.disabled,id:e.id,name:e.getAttribute('aria-label')}})()",
      { disabled: true, id: 'disabled-choice', name: 'Disabled choice' },
    )
    await click('#storybook-root input')
    await check(
      'Does not open',
      "Boolean(document.querySelector('.autocomplete'))",
      false,
    )
  })
  await journey('empty-select', async () => {
    await story('integration-overlays--empty-select')
    await click('#storybook-root input')
    await key('ArrowDown', 'ArrowDown', 40)
    await key('Enter', 'Enter', 13)
  })
  await journey('nested-overlay-shields', async () => {
    await story('integration-overlays--nested')
    await click('[data-scope=dialog][data-part=trigger]')
    await click('#open-child')
    await pointer('mouseMoved', { x: 1000, y: 780 })
    await delay(350)
    await check(
      'Nested native button appearance',
      "getComputedStyle(document.querySelector('#open-child')).backgroundColor",
      'rgb(51, 51, 51)',
    )
    await check(
      'Correct positioning anchor',
      "(() => {let a=document.querySelector('#open-child').getBoundingClientRect(),b=document.querySelector('[data-scope=popover][data-part=content]').getBoundingClientRect();return b.x>0&&b.y>=a.bottom})()",
      true,
    )
    await click('#open-menu')
    await key('Escape', 'Escape', 27)
    await check('Menu focus restored', 'document.activeElement.id', 'open-menu')
    await check(
      'Parent remains',
      "Boolean(document.querySelector('[data-overlay-shield=popover]'))",
      true,
    )
    await click('input[aria-label="Nested choice"]')
    await check(
      'Nested select shield covers the viewport outside its parent popover',
      "(() => {const e=document.querySelector('[data-nv-overlay-shield]'),r=e.getBoundingClientRect();return Math.abs(r.x)<1&&Math.abs(r.y)<1&&Math.abs(r.width-innerWidth)<1&&Math.abs(r.height-innerHeight)<1&&document.elementFromPoint(8,8)===e})()",
      true,
    )
    await check(
      'Option hit testing',
      "(() => {let e=document.querySelector('[data-test=beta]'),r=e.getBoundingClientRect();return e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))})()",
      true,
    )
    await click('[data-test=beta]')
    await check(
      'Pointer selection',
      "document.querySelector('#choice-value').textContent",
      'b',
    )
    await click('input[aria-label="Nested choice"]')
    await waitFor("Boolean(document.querySelector('.autocomplete'))")
    const position = await point('#parent-action')
    await pointer('mouseMoved', position)
    await pointer('mousePressed', position)
    try {
      await delay(150)
      await check(
        'Shield survives down',
        "getComputedStyle(document.querySelector('[data-nv-overlay-shield]')).display !== 'none'",
        true,
      )
    } finally {
      await pointer('mouseReleased', position)
    }
    await delay(250)
    await check(
      'Underlying handlers untouched',
      "['action-count','release-count','pointer-release-count'].map(id=>document.getElementById(id).textContent)",
      ['0', '0', '0'],
    )
    await waitFor("!document.querySelector('.autocomplete')")
    await check(
      'Only select closes',
      "({select:Boolean(document.querySelector('.autocomplete')),popover:Boolean(document.querySelector('[data-overlay-shield=popover]')),dialog:Boolean(document.querySelector('[data-scope=dialog][data-part=content]'))})",
      { select: false, popover: true, dialog: true },
    )
  })
  report.status = report.journeys.every((result) => result.status === 'passed')
    ? 'passed'
    : 'failed'
} catch (error) {
  report.error = String(error.stack || error)
} finally {
  for (const task of pending.values()) {
    clearTimeout(task.timer)
    task.reject(new Error('Browser test ended'))
  }
  pending.clear()
  socket?.close()
  if (target)
    await request(`/json/close/${target.id}`).catch((error) => {
      report.status = 'failed'
      report.cleanupError = String(error)
    })
  await writeFile(
    resolve(output, 'report.json'),
    JSON.stringify(report, null, 2),
  )
}
console.log(JSON.stringify(report, null, 2))
process.exitCode = report.status === 'passed' ? 0 : 1
