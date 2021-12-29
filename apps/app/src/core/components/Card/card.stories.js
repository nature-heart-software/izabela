/* eslint-disable import/no-extraneous-dependencies */
import NvCard from './NvCard.vue'
import { props } from './card.shared'
const theme = require('@/theme')

export default {
  title: 'Card',
  argTypes: {
    content: {
      defaultValue: 'hello world',
      control: { type: 'text' },
    },
  },
}

const Template = (args) => ({
  components: { NvCard },
  setup() {
    return {
      args,
    }
  },
  template:
    args.template ||
    `
      <nv-card v-bind="args">{{args.content}}</nv-card>
    `,
})

export const Default = Template.bind({})
Default.args = {}
