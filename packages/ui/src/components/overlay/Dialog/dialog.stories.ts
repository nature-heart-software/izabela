/* eslint-disable import/no-extraneous-dependencies */
import { StoryFn } from '@storybook/vue3'
import { NvButton, NvCenter, NvDialog, NvText, NvGroup } from '@/components'

export default {
  title: 'Dialog',
}

const Template: StoryFn = (args) => ({
  components: { NvDialog, NvButton, NvText, NvCenter, NvGroup },
  setup() {
    return {
      args,
    }
  },
  template: `
      <NvCenter>
      <NvDialog v-bind="args">
        <template #title>
          Action is required
        </template>
        <template #description>
          Are you sure you want to proceed with this action?
        </template>
        <template #footer>
            <NvGroup justify="right">
                <NvButton>Cancel</NvButton>
                <NvButton type="plain">Confirm</NvButton>
            </NvGroup>
        </template>
        <template #reference>
          <NvButton>Check this out</NvButton>
        </template>
      </NvDialog>
      </NvCenter>
    `,
})

export const Default = Template.bind({})
Default.args = {}
