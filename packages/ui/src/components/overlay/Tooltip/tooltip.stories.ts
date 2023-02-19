/* eslint-disable import/no-extraneous-dependencies */
import { Story } from '@storybook/vue3'
import { NvButton, NvCenter, NvText, NvTooltip } from '@/components'

export default {
  components: { NvTooltip },
  title: 'Tooltip',
  argTypes: {
    content: {
      defaultValue: 'hello world',
      control: 'text',
    },
  },
}

const Template: Story = (args) => ({
  components: { NvTooltip, NvButton, NvText, NvCenter },
  setup() {
    return {
      args,
    }
  },
  template: `
      <NvCenter>
      <NvTooltip v-bind="args">
        <NvText>
          Some content
        </NvText>
        <template #reference>
          <NvButton>Check this out</NvButton>
        </template>
      </NvTooltip>
      </NvCenter>
    `,
})

export const Default = Template.bind({})
Default.args = {}
