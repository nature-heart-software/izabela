/* eslint-disable import/no-extraneous-dependencies */
import { ref } from 'vue'
import NvSelect from './NvSelect.vue'
import { props } from './select.shared'

export default {
  title: 'Select',
  component: NvSelect,
  argTypes: {
    size: {
      defaultValue: props.size.default,
      control: 'inline-radio',
      options: ['sm', 'md', 'lg'],
    },
  },
}

const Template = (args) => ({
  components: { NvSelect },
  setup() {
    return {
      args,
      inputValue: ref(args.content),
    }
  },
  template:
    args.template ||
    `
      <nv-select v-model="inputValue" v-bind="args"></nv-select>
    `,
})

export const Default = Template.bind({})
Default.args = {}
