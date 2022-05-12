/* eslint-disable import/no-extraneous-dependencies */
import {ref} from 'vue'
import NvSwitch from './NvSwitch.vue'

export default {
  title: 'Switch',
  argTypes: {
    value: { control: 'boolean', defaultValue: false },
  },
}

const Template = (args) => ({
  components: { NvSwitch },
  setup() {
    return {
      args,
      value: ref(args.value),
    }
  },
  template:
    args.template ||
    `
      <nv-switch v-bind="args" v-model="value"/>
    `,
})

export const Default = Template.bind({})
Default.args = {}
