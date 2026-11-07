import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from '@vue/compiler-sfc'

type Root = NonNullable<
  NonNullable<ReturnType<typeof parse>['descriptor']['template']>['ast']
>
type TemplateElement = Extract<Root['children'][number], { type: 1 }>
const app = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../../apps/app/src',
)
const consumers = [
  {
    path: 'teams/messenger/components/NvShortcutMessage.vue',
    components: ['engine.voiceSelectComponent'],
  },
  {
    path: 'teams/messenger/components/NvProfileCard.vue',
    components: [
      'speechEngine.voiceSelectComponent',
      'currentEngineSettingsComponent',
    ],
  },
  {
    path: 'teams/messenger/views/NvSettingsEngine.vue',
    components: ['currentEngineSettingsComponent'],
  },
  {
    path: 'teams/messenger/views/NvSettingsAudioInput.vue',
    components: ['currentEngineSettingsComponent'],
  },
  {
    path: 'features/translation/components/forms/NvTranslationForm.vue',
    components: ['currentEngineSettingsComponent'],
  },
]
function elements(root: Root) {
  const result: TemplateElement[] = []
  function visit(node: Root | Root['children'][number]) {
    if (node.type === 1) result.push(node)
    if (node.type === 0 || node.type === 1) node.children.forEach(visit)
  }
  visit(root)
  return result
}
function binding(node: TemplateElement, name: string) {
  const prop = node.props.find(
    (prop) =>
      prop.type === 7 &&
      prop.name === 'bind' &&
      prop.arg?.type === 4 &&
      prop.arg.content === name,
  )
  return prop?.type === 7 && prop.exp?.type === 4 ? prop.exp.content : undefined
}

describe('engine view async-region integration', () => {
  it.each(consumers)(
    '$path preserves each dynamic engine slot inside an unkeyed stable region',
    ({ path, components }) => {
      const source = readFileSync(resolve(app, path), 'utf8')
      const nodes = elements(parse(source).descriptor.template!.ast!)
      const regions = nodes.filter((node) => node.tag === 'NvAsyncRegion')
      expect(regions.map((node) => binding(node, 'component')).sort()).toEqual(
        [...components].sort(),
      )
      for (const region of regions) {
        expect(binding(region, 'key')).toBeUndefined()
        if (binding(region, 'component')?.endsWith('voiceSelectComponent')) {
          expect(
            region.props.some(
              (prop) =>
                prop.type === 6 &&
                prop.name === 'mode' &&
                prop.value?.content === 'control',
            ),
          ).toBe(true)
          expect(
            region.props.some(
              (prop) => prop.type === 7 && prop.name === 'model',
            ),
          ).toBe(true)
        }
      }
      expect(
        nodes.filter(
          (node) =>
            node.tag === 'component' &&
            components.includes(binding(node, 'is') || ''),
        ),
      ).toHaveLength(0)
    },
  )
})
