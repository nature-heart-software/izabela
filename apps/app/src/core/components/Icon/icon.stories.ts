/* eslint-disable import/no-extraneous-dependencies */
import tokens from '@/styles/tokens'
import { Story } from '@storybook/vue3'
import NvIcon from './NvIcon.vue'
import { props } from './icon.shared'

export default {
  title: 'Icon',
  argTypes: {
    size: {
      defaultValue: props.size.default,
      options: Object.keys(tokens.fontSize).map((key) => key),
      control: 'inline-radio',
    },
  },
}

const Template: Story = (args) => ({
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
}
