/* eslint-disable import/no-extraneous-dependencies */
import { StoryFn } from '@storybook/vue3'
import {
    NvButton,
    NvCenter,
    NvContextMenu,
    NvOption,
    NvText,
} from '@/components'

export default {
    title: 'ContextMenu',
}

const Template: StoryFn = (args) => ({
    components: { NvContextMenu, NvButton, NvText, NvCenter, NvOption },
    setup() {
        return {
            args,
        }
    },
    template: `
      <NvCenter>
      <NvContextMenu v-bind="args">
        <NvOption>
          Hello
        </NvOption>
        <NvOption>
          World
        </NvOption>
        <template #reference>
          <NvButton>Check this out</NvButton>
        </template>
      </NvContextMenu>
      </NvCenter>
      <script>
      import NvContextMenu from './NvContextMenu';

      export default {
        components: {NvContextMenu},
      }
      </script>`,
})

export const Default = Template.bind({})
Default.args = {}
