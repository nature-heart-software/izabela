import { defineAsyncComponent, ref } from 'vue'
import { loadingDirective } from './loading'
import {
  NvButton,
  NvDialog,
  NvPopover,
  NvContextMenu,
  NvSelect,
  NvStack,
  NvTooltip,
} from './components'

export default { title: 'Integration/Overlays' }

/** A nested overlay journey with observable underlying-action protection. */
export const Nested = {
  render: () => ({
    components: {
      NvButton,
      NvDialog,
      NvPopover,
      NvContextMenu,
      NvSelect,
      NvStack,
    },
    setup() {
      const count = ref(0)
      const choice = ref('a')
      const releases = ref(0)
      const pointerReleases = ref(0)
      return {
        count,
        choice,
        releases,
        pointerReleases,
        options: [
          { label: 'Alpha', value: 'a' },
          { label: 'Beta', value: 'b', attrs: { 'data-test': 'beta' } },
        ],
        menu: [{ label: 'Run action', onClick: () => count.value++ }],
      }
    },
    template: `
      <NvStack>
        <NvButton id="outside-action" @click="count++">Underlying action</NvButton>
        <output id="action-count">{{ count }}</output>
        <output id="release-count">{{ releases }}</output>
        <output id="pointer-release-count">{{ pointerReleases }}</output>
        <output id="choice-value">{{ choice }}</output>
        <NvDialog>
          <template #reference>Open parent dialog</template>
          <template #title>Parent dialog</template>
          <template #description>Child overlays stay inside the parent focus boundary.</template>
          <template #footer>
            <NvStack>
              <NvButton id="parent-action" @click="count++" @mouseup="releases++" @pointerup="pointerReleases++">Parent action</NvButton>
              <NvPopover>
                <template #reference><NvButton id="open-child">Open child popover</NvButton></template>
                <NvStack>
                  <NvButton id="child-action" @click="count++">Child action</NvButton>
                  <NvContextMenu :options="menu"><NvButton id="open-menu">Open nested menu</NvButton></NvContextMenu>
                  <NvSelect v-model="choice" :options="options" aria-label="Nested choice" />
                </NvStack>
              </NvPopover>
              <NvDialog>
                <template #reference>Open nested dialog</template>
                <template #title>Nested dialog</template>
                <template #footer><NvButton id="nested-dialog-action" @click="count++">Nested dialog action</NvButton></template>
              </NvDialog>
            </NvStack>
          </template>
        </NvDialog>
      </NvStack>
    `,
  }),
}

function scrollingOverlay(popover: boolean) {
  return {
    render: () => ({
      components: { NvSelect, NvPopover, NvButton },
      setup: () => ({
        popover,
        choice: ref('0'),
        clicks: ref(0),
        options: Array.from({ length: 100 }, (_, index) => ({
          label: `Option ${index}`,
          value: String(index),
        })),
      }),
      template: `
        <div id="scroll-page" style="width:720px;height:300px;overflow:auto;position:relative">
          <div style="width:1100px;min-height:1200px;padding:100px 16px 0">
            <NvSelect v-if="!popover" id="scroll-select" v-model="choice" :options="options" aria-label="Scrolling choice" style="width:220px" />
            <NvPopover v-else>
              <template #reference><NvButton id="scroll-popover-trigger">Open popover</NvButton></template>
              <div id="scroll-panel" style="width:240px;height:200px;overflow:auto">
                <div style="min-height:900px;padding-top:40px">
                  <NvSelect id="scroll-nested-select" v-model="choice" :options="options" aria-label="Nested scrolling choice" />
                </div>
              </div>
            </NvPopover>
            <NvButton id="scroll-underlying-action" style="position:sticky;left:500px;top:240px" @click="clicks++">Underlying action</NvButton>
          </div>
        </div>
        <output id="scroll-action-count">{{ clicks }}</output>
      `,
    }),
  }
}

export const SelectScrollThrough = scrollingOverlay(false)
export const PopoverScrollThrough = scrollingOverlay(true)

export const SelectTooltips = {
  render: () => ({
    components: {
      NvSelect,
      NvStack,
      NvTooltip,
      LazySelect: defineAsyncComponent(
        () =>
          new Promise<typeof NvSelect>((resolve) => {
            setTimeout(() => resolve(NvSelect), 150)
          }),
      ),
    },
    setup: () => ({
      variants: [
        { id: 'sm', size: 'sm' },
        { id: 'md', size: 'md' },
        { id: 'lg', size: 'lg' },
        { id: 'multiple', size: 'md', multiple: true },
        { id: 'disabled', size: 'md', disabled: true },
        { id: 'readonly', size: 'md', readonly: true },
        { id: 'async', size: 'sm', async: true },
      ],
      options: [
        { label: 'Alpha', value: 'a' },
        { label: 'Beta', value: 'b' },
      ],
    }),
    template: `
      <NvStack spacing="5" style="width: 260px; margin: 80px">
        <NvTooltip v-for="variant in variants" :key="variant.id" :tippy-options="{ delay: [80, 0], duration: 0, offset: [0, 12] }">
          Choose a speech engine ({{ variant.id }})
          <template #reference>
            <component :is="variant.async ? 'LazySelect' : 'NvSelect'" :id="'tooltip-select-' + variant.id" :aria-label="'Speech engine ' + variant.id"
              :size="variant.size" :multiple="variant.multiple" :disabled="variant.disabled" :readonly="variant.readonly"
              :model-value="variant.multiple ? ['a'] : 'a'" :options="options" />
          </template>
        </NvTooltip>
      </NvStack>
    `,
  }),
}

export const DisabledSelect = {
  render: () => ({
    components: { NvSelect },
    setup: () => ({ options: [{ label: 'Alpha', value: 'a' }] }),
    template:
      '<NvSelect disabled :options="options" aria-label="Disabled choice" id="disabled-choice" />',
  }),
}

export const EmptySelect = {
  render: () => ({
    components: { NvSelect },
    template: '<NvSelect :options="[]" aria-label="Empty choice" />',
  }),
}

export const Loading = {
  render: () => ({
    components: { NvButton, NvSelect, NvStack },
    directives: { loading: loadingDirective },
    setup: () => ({ options: [{ label: 'Alpha', value: 'a' }] }),
    template: `
      <NvStack spacing="5" style="width: 260px">
        <div data-test="loading-select"><NvSelect v-loading="true" :options="options" model-value="a" /></div>
        <NvButton v-loading="true" data-test="loading-host">Pending content</NvButton>
        <NvButton loading data-test="loading-button">Pending content</NvButton>
      </NvStack>
    `,
  }),
}
