/* eslint-disable import/no-extraneous-dependencies */
import { ref } from 'vue'
import { StoryFn } from '@storybook/vue3'
import { props, sizeValues } from './textarea.shared'
import NvTextarea from './NvTextarea.vue'

export default {
  title: 'Textarea',
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

const Template: StoryFn = (args) => ({
  components: { NvTextarea },
  setup() {
    return {
      args,
      inputValue: ref(args.content),
    }
  },
  template: `
      <NvTextarea v-model="inputValue" v-bind="args"/>
    `,
})

export const Default = Template.bind({})
Default.args = {}
