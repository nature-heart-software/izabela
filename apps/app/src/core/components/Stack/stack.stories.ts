/* eslint-disable import/no-extraneous-dependencies */
import { Story } from '@storybook/vue3'
import NvStack from './NvStack.vue'
import NvButton from '../Button/NvButton.vue'

export default {
  title: 'Stack',
  component: NvStack,
}

const Template: Story = (args) => ({
  components: { NvStack, NvButton },
  setup() {
    return {
      args,
    }
  },
  template:
    args.template ||
    `
      <nv-stack v-bind="args">
        <nv-button squared>1</nv-button>
        <nv-button squared>2</nv-button>
        <nv-button squared>3</nv-button>
      </nv-stack>`,
})

export const Default = Template.bind({})
Default.args = {}
