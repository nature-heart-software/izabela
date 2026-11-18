const assert = require('node:assert/strict')

async function checkProfileTooltipScroll({ messenger, evaluate, key }) {
  await evaluate(messenger, async () => {
    const add = [...document.querySelectorAll('#settings button')].find(
      (button) => button.textContent.trim() === 'Add profile',
    )
    if (!add) throw new Error('Missing Add profile button')
    add.focus()
    await new Promise(requestAnimationFrame)
    await new Promise(requestAnimationFrame)
    const panes = []
    for (let node = add.parentElement; node; node = node.parentElement)
      if (getComputedStyle(node).overflowY === 'auto') panes.push(node)
    if (!panes.length) throw new Error('Missing Profiles scroll viewport')
    const pane = panes[0]
    const previous = ['--x', '--y'].map((name) => [
      name,
      pane.style.getPropertyValue(name),
      pane.style.getPropertyPriority(name),
    ])
    // Nested floating panels supply these inheritable coordinates. Exercise an
    // offset beyond this viewport, as can happen with monitor/drag placement.
    pane.style.setProperty('--x', '1800px')
    pane.style.setProperty('--y', '900px')
    const measure = () =>
      panes.map((node) => ({
        width: node.clientWidth,
        height: node.clientHeight,
        scrollWidth: node.scrollWidth,
        scrollHeight: node.scrollHeight,
      }))
    const state = (window.__profileTooltipScroll = {
      baseline: measure(),
      applyId: pane.querySelector('[data-scope="tooltip"][data-part="trigger"]')
        ?.id,
      frames: [],
      done: false,
      cleanup: () => {
        for (const [name, value, priority] of previous)
          if (value) pane.style.setProperty(name, value, priority)
          else pane.style.removeProperty(name)
        delete window.__profileTooltipScroll
      },
    })
    const record = () => {
      if (window.__profileTooltipScroll !== state) return
      state.frames.push(measure())
      if (state.frames.length < 45) requestAnimationFrame(record)
      else state.done = true
    }
    requestAnimationFrame(record)
  })
  try {
    await key('Tab')
    const result = await evaluate(messenger, async () => {
      const state = window.__profileTooltipScroll
      while (!state.done) await new Promise(requestAnimationFrame)
      const tooltip = document.querySelector(
        '[data-scope="tooltip"][role="tooltip"]',
      )
      return {
        baseline: state.baseline,
        frames: state.frames,
        tooltip: tooltip?.textContent.trim(),
        applyFocused:
          !!state.applyId && document.activeElement?.id === state.applyId,
      }
    })
    assert.equal(
      result.tooltip,
      'Apply',
      'Tab reaches the profile Apply tooltip',
    )
    assert.equal(result.applyFocused, true, 'Apply retains keyboard focus')
    for (const frame of result.frames)
      assert.deepEqual(
        frame,
        result.baseline,
        'Tooltip opening must not resize or expand a scroll viewport',
      )
  } finally {
    await evaluate(messenger, () => window.__profileTooltipScroll?.cleanup())
  }
}

module.exports = { checkProfileTooltipScroll }
