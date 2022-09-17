/* eslint-disable import/no-extraneous-dependencies */
import { ref } from 'vue'
import { Story } from '@storybook/vue3'
import { props, sizeValues } from './input.shared'
import { NvInput } from '@/components'

export default {
  title: 'Input',
  argTypes: {
    content: {
      defaultValue: 'hello world',
      control: 'text',
    },
    placeholder: {
      defaultValue: 'Enter some text...',
      control: 'text',
    },
    size: {
      defaultValue: props.size.default,
      control: 'inline-radio',
      options: sizeValues,
    },
  },
}

const Template: Story = (args) => ({
  components: { NvInput },
  setup() {
    return {
      args,
      inputValue: ref(args.content),
    }
  },
  template: `
      <NvInput v-model="inputValue" v-bind="args"/>
    `,
})

export const Default = Template.bind({})
Default.args = {}
