// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, withDirectives } from 'vue'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
execFileSync(
  process.execPath,
  [resolve(dirname(fileURLToPath(import.meta.url)), 'build-client.mjs')],
  { stdio: 'pipe' },
)
const clientPath = '../../../coverage/ui-client/test-client.js'
const { loadingDirective } = await import(/* @vite-ignore */ clientPath)

describe('loading directive', () => {
  it('shows a busy status without disabling the host and cleans up on completion', async () => {
    const Host = defineComponent({
      props: { busy: Boolean },
      setup: (props) => () =>
        withDirectives(h('button', 'Save'), [[loadingDirective, props.busy]]),
    })
    const w = mount(Host, { props: { busy: false } })
    expect(w.find('[role="status"]').exists()).toBe(false)
    await w.setProps({ busy: true })
    expect(w.attributes('aria-busy')).toBe('true')
    expect(w.get('[role="status"]').attributes('aria-label')).toBe('Loading')
    expect((w.element as HTMLButtonElement).disabled).toBe(false)
    await w.setProps({ busy: false })
    expect(w.find('[role="status"]').exists()).toBe(false)
    expect(w.attributes('aria-busy')).toBeUndefined()
    w.unmount()
  })
})
