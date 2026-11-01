// @vitest-environment jsdom
import { createHash } from 'node:crypto'
import { readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import * as icons from '../src/main'
import catalog from './catalog.json'

const directory = resolve('packages/icons/src/components/icons')
const exported = Object.entries(icons)

function geometry(svg: Element) {
  return [...svg.querySelectorAll('*')].map((element) => ({
    tag: element.tagName.toLowerCase(),
    attributes: Object.fromEntries(
      [...element.attributes]
        .map(({ name, value }) => [name, value])
        .sort(([a], [b]) => a.localeCompare(b)),
    ),
  }))
}

describe('exported SVG catalog', () => {
  it('reconciles every file, public export and golden geometry entry', () => {
    const names = readdirSync(directory)
      .filter((name) => name.endsWith('.vue'))
      .map((name) => name.slice(0, -4))
      .sort()
    expect(names).toHaveLength(1205)
    expect(Object.keys(icons).sort()).toEqual(names)
    expect(Object.keys(catalog).sort()).toEqual(names)
  })

  it.each(exported)(
    '%s renders its actual SVG geometry and forwards root attributes',
    (name, component) => {
      const clicked = vi.fn()
      const wrapper = mount(component, {
        attrs: {
          width: 32,
          height: '2em',
          fill: 'currentColor',
          class: 'consumer-icon',
          style: 'color: red',
          'aria-label': name,
          'data-consumer': name,
          onClick: clicked,
        },
      })
      try {
        const svg = wrapper.element
        expect(svg.tagName.toLowerCase()).toBe('svg')
        expect(svg.namespaceURI).toBe('http://www.w3.org/2000/svg')
        expect(svg.getAttribute('viewBox')).toBe('0 0 24 24')
        expect(svg.getAttribute('width')).toBe('32')
        expect(svg.getAttribute('height')).toBe('2em')
        expect(svg.getAttribute('fill')).toBe('currentColor')
        expect(svg.getAttribute('aria-label')).toBe(name)
        expect(svg.getAttribute('data-consumer')).toBe(name)
        expect(svg.classList.contains('consumer-icon')).toBe(true)
        expect((svg as SVGElement).style.color).toBe('red')
        const shapes = geometry(svg)
        expect(shapes.length).toBeGreaterThan(0)
        expect(
          createHash('sha256').update(JSON.stringify(shapes)).digest('hex'),
        ).toBe(catalog[name as keyof typeof catalog])
        svg.dispatchEvent(new MouseEvent('click'))
        expect(clicked).toHaveBeenCalledTimes(1)
      } finally {
        wrapper.unmount()
      }
    },
  )

  it('updates forwarded attributes without changing geometry or inventing accessibility defaults', async () => {
    const wrapper = mount(icons.NvX)
    const before = geometry(wrapper.element)
    expect(wrapper.attributes('role')).toBeUndefined()
    expect(wrapper.attributes('aria-hidden')).toBeUndefined()
    expect(wrapper.find('title').exists()).toBe(false)
    await wrapper.setProps({
      width: '48',
      viewBox: '0 0 48 48',
      'aria-hidden': 'true',
    })
    expect(wrapper.attributes('width')).toBe('48')
    expect(wrapper.attributes('viewBox')).toBe('0 0 48 48')
    expect(wrapper.attributes('aria-hidden')).toBe('true')
    expect(geometry(wrapper.element)).toEqual(before)
    wrapper.unmount()
  })
})
