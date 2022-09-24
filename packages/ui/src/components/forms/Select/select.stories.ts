/* eslint-disable import/no-extraneous-dependencies */
import { ref } from 'vue'
import { Story } from '@storybook/vue3'
import { NvCenter, NvSelect } from '@/components'
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
  components: { NvSelect, NvCenter },
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
      <NvSelect v-model="inputValue" v-bind="args" :options="options"/>
      </NvCenter>`,
})

export const Default = Template.bind({})
Default.args = {
  valueKey: 'voicemodel_uuid',
  labelKey: 'display_name',
}
export const Multiple = Template.bind({})
Multiple.args = {
  valueKey: 'voicemodel_uuid',
  labelKey: 'display_name',
  multiple: true,
  inputValue: [],
}
