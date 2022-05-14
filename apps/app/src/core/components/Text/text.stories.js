/* eslint-disable import/no-extraneous-dependencies */
import theme from '@/styles/tokens'
import NvText from './NvText.vue'

export default {
  title: 'Text',
  argTypes: {
    content: {
      defaultValue: 'hello world',
      control: { type: 'text' },
    },
    size: {
      options: Object.keys(theme.fontSize).map((key) => key),
      control: { type: 'inline-radio' },
    },
    type: {
      options: ['caption', 'body-small', 'body', 'subtitle', 'title'],
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
Default.args = {}
