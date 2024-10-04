/* eslint-disable import/no-extraneous-dependencies */
import { StoryFn } from '@storybook/vue3'
import { props, typeValues } from '@/components/feedback/Alert/alert.shared'
import { sizeValues } from '@/utils/css-in-js'
import { NvAlert } from '@/components'

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
    size: {
      options: sizeValues,
      control: 'inline-radio',
      defaultValue: props.size.default,
    },
  },
}

const Template: StoryFn = (args) => ({
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
