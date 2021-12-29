/* eslint-disable import/no-extraneous-dependencies */
import NvButton from './NvButton.vue'

export default {
  title: 'Button',
  argTypes: {
    content: {
      defaultValue: 'hello world',
      control: { type: 'text' }
    },
    type: {
      defaultValue: 'default',
      options: ['default', 'plain', 'ghost'],
      control: { type: 'inline-radio' },
    },
    size: {
      defaultValue: 'md',
      options: ['xs', 'sm', 'md', 'lg'],
      control: { type: 'inline-radio' },
    },
    selected: {
      defaultValue: false,
      control: { type: 'boolean' },
    },
  },
}

const Template = (args) => ({
  components: { NvButton },
  setup() {
    return {
      args,
    }
  },
  template:
    args.template || `
      <nv-button v-bind="args">{{args.content}}</nv-button>
    `,
})

export const Default = Template.bind({})
Default.args = {}

export const Plain = Template.bind({})
Plain.args = {
  type: 'plain',
}

export const Ghost = Template.bind({})
Ghost.args = {
  type: 'ghost',
}
