/* eslint-disable import/no-extraneous-dependencies */
import tokens from '@/styles/tokens'
import { Story } from '@storybook/vue3'
import NvText from './NvText.vue'

export default {
  title: 'Text',
  argTypes: {
    content: {
      defaultValue: 'hello world',
      control: 'text',
    },
    size: {
      options: Object.keys(tokens.fontSize).map((key) => key),
      control: 'inline-radio',
    },
    type: {
      options: ['caption', 'body-small', 'body', 'subtitle', 'title'],
      control: 'inline-radio',
    },
  },
}

const Template: Story = (args) => ({
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
