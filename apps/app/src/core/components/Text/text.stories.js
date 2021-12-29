/* eslint-disable import/no-extraneous-dependencies */
import NvText from './NvText.vue'
const theme = require('@/theme')

export default {
  title: 'Text',
  argTypes: {
    size: {
      options: Object.keys(theme.fontSize).map((key) => key),
      control: { type: 'inline-radio' },
    },
  },
}

const Template = (args) => ({
  components: { NvText },
  setup() {
    return {
      args,
    }
  },
  template:
    args.template ||
    `
      <nv-text v-bind="args">{{args.content}}</nv-text>
    `,
})

export const Default = Template.bind({})
Default.args = {
  content: `hello world`,
}
