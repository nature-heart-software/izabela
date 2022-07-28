/* eslint-disable import/no-extraneous-dependencies */
import { Story } from '@storybook/vue3'
import { props, typeValues } from '@/core/components/Alert/alert.shared'
import NvAlert from './NvAlert.vue'

export default {
  title: 'Alert',
  argTypes: {
    content: {
      defaultValue: 'hello world',
      control: 'text',
    },
    type: {
      options: typeValues,
      control: 'inline-radio',
      defaultValue: props.type.default,
    },
  },
}

const Template: Story = (args) => ({
  components: { NvAlert },
  setup() {
    return {
      args,
    }
  },
  template: `
    <NvAlert v-bind="args">{{ args.content }}</NvAlert>
  `,
})

export const Default = Template.bind({})
Default.args = {}
