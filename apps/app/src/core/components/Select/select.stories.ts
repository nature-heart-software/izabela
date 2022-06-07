/* eslint-disable import/no-extraneous-dependencies */
import { ref } from 'vue'
import { Story } from '@storybook/vue3'
import NvSelect from './NvSelect.vue'
import NvOption from './NvOption.vue'
import { props, sizeValues } from './select.shared'

export default {
  title: 'Select',
  component: NvSelect,
  argTypes: {
    size: {
      defaultValue: props.size.default,
      control: 'inline-radio',
      options: sizeValues,
    },
    placeholder: {
      defaultValue: 'Select some options...',
      control: 'text',
    },
  },
}

const Template: Story = (args) => ({
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
  template: `
      <NvSelect v-model="inputValue" v-bind="args">
        <NvOption
          v-for="item in options"
          :key="item.value"
          :label="item.label"
          :value="item.value"
          :disabled="item.disabled"
        >
        </NvOption>
      </NvSelect>
    `,
})

export const Default = Template.bind({})
Default.args = {}
