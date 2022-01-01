/* eslint-disable import/no-extraneous-dependencies */
import { ref } from 'vue'
import NvSelect from './NvSelect.vue'
import NvOption from './NvOption.vue'
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
    placeholder: {
      defaultValue: 'Select some options...',
      control: { type: 'text' },
    },
  },
}

const Template = (args) => ({
  components: { NvSelect, NvOption },
  setup() {
    return {
      args,
      inputValue: ref(args.content),
      options: ref(
        args.options || [
          {
            value: 'Option1',
            label: 'Option1',
          },
          {
            value: 'Option2',
            label: 'Option2',
          },
          {
            value: 'Option3',
            label: 'Option3',
          },
          {
            value: 'Option4',
            label: 'Option4',
            disabled: true,
          },
          {
            value: 'Option5',
            label: 'Option5',
          },
        ],
      ),
    }
  },
  template:
    args.template ||
    `
      <nv-select v-model="inputValue" v-bind="args">
        <nv-option
          v-for="item in options"
          :key="item.value"
          :label="item.label"
          :value="item.value"
          :disabled="item.disabled"
        >
        </nv-option>
      </nv-select>
    `,
})

export const Default = Template.bind({})
Default.args = {}
