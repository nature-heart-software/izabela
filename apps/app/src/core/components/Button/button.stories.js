/* eslint-disable import/no-extraneous-dependencies */
import NvButton from './NvButton.vue'

export default {
  title: 'Button',
  argTypes: {
    size: {
      options: ['xs', 'sm', 'md', 'lg'],
      control: { type: 'inline-radio' },
    },
  },
}

const Template = (args) => ({
  components: { NvButton },
  setup() {
    return {
      ...args,
    }
  },
  template:
    args.template || `
      <nv-button :size="size">{{content}}</nv-button>
    `,
})

export const Default = Template.bind({})
Default.args = {
  content: `hello world`,
  size: 'md'
}
