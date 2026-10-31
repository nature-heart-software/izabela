const assert = require('node:assert/strict')

const memoryCases = [
  'memory: repeated settings navigation releases detached hitboxes',
]

async function runMemory({ check, evaluate, messenger, route, sleep }) {
  await check(memoryCases[0], async () => {
    const visit = async () => {
      await route('/settings/general', 'Development')
      await evaluate(messenger, async () => {
        const router =
          document.querySelector('#app').__vue_app__.config.globalProperties
            .$router
        await router.push('/')
      })
      await sleep(350)
    }
    const inspect = async () => {
      const debug = messenger.webContents.debugger
      debug.attach('1.3')
      try {
        await debug.sendCommand('HeapProfiler.collectGarbage')
        const { result } = await debug.sendCommand('Runtime.evaluate', {
          expression: 'window',
        })
        const { listeners } = await debug.sendCommand(
          'DOMDebugger.getEventListeners',
          { objectId: result.objectId },
        )
        return {
          resize: listeners.filter((listener) => listener.type === 'resize')
            .length,
          focus: listeners.filter((listener) => listener.type === 'focus')
            .length,
          ...(await debug.sendCommand('Memory.getDOMCounters')),
        }
      } finally {
        debug.detach()
      }
    }
    // Warm the lazy route and reusable popovers before checking repeated use.
    for (let index = 0; index < 3; index++) await visit()
    const before = await inspect()
    for (let index = 0; index < 5; index++) await visit()
    const after = await inspect()
    console.log('MEMORY_RETENTION ' + JSON.stringify({ before, after }))
    assert.equal(
      after.resize,
      before.resize,
      'retained global resize listeners',
    )
    assert.equal(after.focus, before.focus, 'retained global focus listeners')
    assert.ok(
      after.nodes <= before.nodes + 300,
      `retained detached DOM trees: ${before.nodes} -> ${after.nodes}`,
    )
  })
}

module.exports = { memoryCases, runMemory }
