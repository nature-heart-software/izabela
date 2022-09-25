/* eslint-disable import/no-extraneous-dependencies */
import {
  Direction,
  directionValues,
} from '@/components/miscellaneous/Divider/divider.shared'
import { Story } from '@storybook/vue3'
import { NvDivider } from '@/components'

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
      <NvDivider v-bind="args"/>
    `,
})

export const Default = Template.bind({})
Default.args = {}

export const Vertical = Template.bind({})
Vertical.args = {
  direction: 'vertical',
  class: 'h-64',
}
