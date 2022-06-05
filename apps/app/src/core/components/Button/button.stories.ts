/* eslint-disable import/no-extraneous-dependencies */
import { Story } from '@storybook/vue3'
import NvButton from './NvButton.vue'
import { props, sizeValues, typeValues } from './button.shared'

export default {
  title: 'Button',
  component: NvButton,
  argTypes: {
    content: {
      defaultValue: 'hello world',
      control: 'text',
    },
    type: {
      defaultValue: props.type.default,
      options: typeValues,
      control: 'inline-radio',
    },
    size: {
      defaultValue: props.size.default,
      options: sizeValues,
      control: 'inline-radio',
    },
    selected: {
      defaultValue: props.selected.default,
      control: 'boolean',
    },
    squared: {
      defaultValue: props.squared.default,
      control: 'boolean',
    },
    iconName: {
      defaultValue: '',
      control: 'text',
    },
  },
}

const Template: Story = (args) => ({
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
