/* eslint-disable import/no-extraneous-dependencies */
import NvButton from './NvButton.vue'
import { props } from './button.shared'

export default {
  title: 'Button',
  component: NvButton,
  argTypes: {
    content: {
      defaultValue: 'hello world',
      control: { type: 'text' },
    },
    type: {
      defaultValue: props.type.default,
      options: ['default', 'plain', 'ghost', 'ghost-alt'],
      control: { type: 'inline-radio' },
    },
    size: {
      defaultValue: props.size.default,
      options: ['xs', 'sm', 'md', 'lg'],
      control: { type: 'inline-radio' },
    },
    selected: {
      defaultValue: props.selected.default,
      control: { type: 'boolean' },
    },
    squared: {
      defaultValue: props.squared.default,
      control: { type: 'boolean' },
    },
    iconName: {
      defaultValue: '',
      control: { type: 'text' },
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
    args.template ||
    `
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
export const GhostAlt = Template.bind({})
GhostAlt.args = {
  type: 'ghost-alt',
}

export const WithIcon = Template.bind({})
WithIcon.args = {
  iconName: 'github',
}

export const WithIconOnly = Template.bind({})
WithIconOnly.args = {
  iconName: 'github',
  content: '',
}
