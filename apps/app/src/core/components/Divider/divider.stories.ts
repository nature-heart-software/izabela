/* eslint-disable import/no-extraneous-dependencies */
import { directionValues, Direction } from '@/core/components/Divider/divider.shared'
import { Story } from '@storybook/vue3'
import NvDivider from './NvDivider.vue'

export default {
  title: 'Divider',
  argTypes: {
    direction: {
      defaultValue: 'horizontal' as Direction,
      options: directionValues,
      control: 'inline-radio',
    },
  },
}

const Template: Story = (args) => ({
  components: { NvDivider },
  setup() {
    return {
      args,
    }
  },
  template: `
      <NvDivider v-bind="args" />
    `,
})

export const Default = Template.bind({})
Default.args = {}

export const Vertical = Template.bind({})
Vertical.args = {
  direction: 'vertical',
}
