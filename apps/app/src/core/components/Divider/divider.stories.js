/* eslint-disable import/no-extraneous-dependencies */
import NvDivider from './NvDivider.vue'
import { props } from './divider.shared'

const theme = require('@/theme')

export default {
  title: 'Divider',
  argTypes: {
    direction: {
      defaultValue: 'horizontal',
      options: ['horizontal', 'vertical'],
      control: { type: 'inline-radio' },
    },
  },
}

const Template = (args) => ({
  components: { NvDivider },
  setup() {
    return {
      args,
    }
  },
  template:
    args.template ||
    `
      <nv-divider v-bind="args" />
    `,
})

export const Default = Template.bind({})
Default.args = {}

export const Vertical = Template.bind({})
Vertical.args = {
  direction: 'vertical',
}
