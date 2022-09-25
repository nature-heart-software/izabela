/* eslint-disable import/no-extraneous-dependencies */
import { Story } from '@storybook/vue3'
import { NvTag } from '@/components'
import { props } from '@/components/forms/Tag/tag.shared'

export default {
  title: 'Tag',
  component: NvTag,
  argTypes: {
    closable: {
      defaultValue: props.closable.default,
      control: 'boolean',
    },
  },
}

const Template: Story = (args) => ({
  components: { NvTag },
  setup() {
    return {
      args,
    }
  },
  template: `
      <NvTag v-bind="args">{{ args.content }}</NvTag>
    `,
})

export const Default = Template.bind({})
Default.args = {
  content: 'Tag',
}
