// @vitest-environment jsdom
import { expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { h, nextTick, shallowRef } from 'vue'
import { pandaComponent } from '../src/utils/panda'
import { cva } from '../src/styled-system/css'

it('keeps option payloads out of Panda recipe memoization while updating style variants', async () => {
  let payloadReads = 0
  const payload = {
    get metadata() {
      payloadReads++
      return { description: 'Provider data that has no effect on styling' }
    },
  }
  const Control = pandaComponent(
    'button',
    { options: Array, modelValue: Object, size: String, disabled: Boolean },
    cva({ variants: { size: { sm: { padding: '1' }, lg: { padding: '4' } } } }),
  )
  const controlProps = shallowRef({
    options: [payload],
    modelValue: payload,
    size: 'sm',
    disabled: false,
  })
  const wrapper = mount({ render: () => h(Control, controlProps.value) })
  try {
    expect(payloadReads).toBe(0)
    const smallClass = wrapper.attributes('class')
    controlProps.value = {
      ...controlProps.value,
      options: [payload, payload],
      disabled: true,
    }
    await nextTick()
    expect(payloadReads).toBe(0)
    expect(wrapper.attributes('class')).toBe(smallClass)
    expect((wrapper.element as HTMLButtonElement).disabled).toBe(true)
    controlProps.value = { ...controlProps.value, size: 'lg' }
    await nextTick()
    expect(wrapper.attributes('class')).not.toBe(smallClass)
    expect(payloadReads).toBe(0)
  } finally {
    wrapper.unmount()
  }
})
