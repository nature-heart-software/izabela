/* eslint-disable import/no-extraneous-dependencies */
import { Story } from '@storybook/vue3'
import { NvButton, NvCenter, NvPopover, NvText } from '@/components'
import { props, sizeValues } from './popover.shared'

export default {
    title: 'Popover',
    argTypes: {
        content: {
            defaultValue: 'hello world',
            control: 'text',
        },
        size: {
            defaultValue: props.size.default,
            control: 'inline-radio',
            options: sizeValues,
        },
    },
}

const Template: Story = (args) => ({
    components: { NvPopover, NvButton, NvText, NvCenter },
    setup() {
        return {
            args,
        }
    },
    template: `
      <NvCenter>
      <NvPopover v-bind="args">
        <NvText>
          Some content
        </NvText>
        <template #reference>
          <NvButton>Check this out</NvButton>
        </template>
      </NvPopover>
      </NvCenter>
    `,
})

export const Default = Template.bind({})
Default.args = {}
