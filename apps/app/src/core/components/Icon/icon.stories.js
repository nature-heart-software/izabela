/* eslint-disable import/no-extraneous-dependencies */
import NvIcon from './NvIcon.vue'
const theme = require('@/theme')

export default {
  title: 'Icon',
  argTypes: {
    size: {
      options: Object.keys(theme.fontSize).map((key) => key),
      control: { type: 'inline-radio' },
    },
  },
}

const Template = (args) => ({
  components: { NvIcon },
  setup() {
    return {
      args,
    }
  },
  template:
    args.template ||
    `
      <nv-icon v-bind="args"></nv-text>
    `,
})

export const Default = Template.bind({})
Default.args = {
  name: 'github',
  size: '2',
}
