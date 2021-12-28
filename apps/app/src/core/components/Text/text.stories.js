/* eslint-disable import/no-extraneous-dependencies */
import NvText from './NvText.vue'

export default {
  title: 'Text',
  argTypes: {
    size: {
      options: Array(16).fill(null).map((_, i) => (i + 1).toString()),
      control: { type: 'select' },
    },
  },
}

const Template = (args) => ({
  components: { NvText },
  setup() {
    return {
      ...args,
    }
  },
  template:
    args.template || `
      <nv-text :size="size">{{content}}</nv-text>
    `,
})
export const Default = Template.bind({})
Default.args = {
  content: `hello world`,
  size: '2'
}
