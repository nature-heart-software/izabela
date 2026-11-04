import { ref } from 'vue'
import { loadingDirective } from './loading'
import {
  NvButton,
  NvDialog,
  NvPopover,
  NvContextMenu,
  NvSelect,
  NvStack,
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
