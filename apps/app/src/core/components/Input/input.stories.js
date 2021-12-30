/* eslint-disable import/no-extraneous-dependencies */
import { ref } from 'vue'
import NvInput from './NvInput.vue'
import { props } from './input.shared'

const theme = require('@/theme')

export default {
  title: 'Input',
  argTypes: {
    content: {
      defaultValue: 'hello world',
      control: { type: 'text' },
    },
    size: {
      defaultValue: props.size.default,
      control: 'inline-radio',
      options: ['sm', 'md', 'lg'],
    },
  },
}

const Template = (args) => ({
  components: { NvInput },
  setup() {
    return {
      args,
      inputValue: ref(args.content),
    }
  },
  template:
    args.template ||
    `
      <nv-input v-model="inputValue" v-bind="args" />
    `,
})

export const Default = Template.bind({})
Default.args = {}
