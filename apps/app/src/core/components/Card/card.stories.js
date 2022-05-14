/* eslint-disable import/no-extraneous-dependencies */
import NvCard from './NvCard.vue'
import { props } from './card.shared'

export default {
  title: 'Card',
  argTypes: {
    content: {
      defaultValue: 'hello world',
      control: { type: 'text' },
    },
    size: {
      defaultValue: props.size.default,
      control: 'inline-radio',
      options: ['xs', 'sm', 'md'],
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
