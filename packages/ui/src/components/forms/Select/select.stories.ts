/* eslint-disable import/no-extraneous-dependencies */
import { ref } from 'vue'
import { Story } from '@storybook/vue3'
import { NvCenter, NvOption, NvSelect, NvVirtualizedSelect } from '@/components'
import { props, sizeValues } from './select.shared'
import voices from '@/mocks/voices.json'

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
  components: { NvSelect, NvOption, NvCenter },
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
      <NvCenter :style="{height: '200px'}">
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
      </NvCenter>
    `,
})

const VirtualizedSelectTemplate: Story = (args) => ({
  components: { NvVirtualizedSelect, NvCenter },
  setup() {
    return {
      args,
      inputValue: ref(args.inputValue),
      options: ref(
        voices.map((voice) => ({
          value: voice,
          label: voice.display_name,
        })),
      ),
    }
  },
  template: `
      <NvCenter :style="{height: '200px'}">
      <NvVirtualizedSelect v-model="inputValue" v-bind="args" :options="options"/>
      </NvCenter>`,
})

export const Default = Template.bind({})
Default.args = {}

export const Virtualized = VirtualizedSelectTemplate.bind({})
Virtualized.args = {
  valueKey: 'voicemodel_uuid',
  labelKey: 'display_name',
}
export const VirtualizedMultiple = VirtualizedSelectTemplate.bind({})
VirtualizedMultiple.args = {
  valueKey: 'voicemodel_uuid',
  labelKey: 'display_name',
  multiple: true,
  inputValue: [],
}
