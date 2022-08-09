/* eslint-disable import/no-extraneous-dependencies */
import { Story } from '@storybook/vue3'
import NvCenter from './NvCenter.vue'
import NvButton from '../Button/NvButton.vue'
import { props } from './center.shared'

export default {
  title: 'Center',
  component: NvCenter,
  argTypes: {
    inline: {
      defaultValue: props.inline.default,
      control: 'boolean',
    },
  },
}

const Template: Story = (args) => ({
  components: { NvCenter, NvButton },
  setup() {
    return {
      args,
    }
  },
  template: `
      <NvCenter v-bind="args" class="bg-gray-10" :style="{height: '200px'}">
        <NvButton>centered</NvButton>
      </NvCenter>`,
})

export const Default = Template.bind({})
Default.args = {}

const InlineTemplate: Story = (args) => ({
  components: { NvCenter, NvButton },
  setup() {
    return {
      args,
    }
  },
  template: `
    <NvCenter v-bind="args">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#000000"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M19 12H6M12 5l-7 7 7 7" />
    </svg>
    &nbsp; submit a request
    </NvCenter>`,
})
export const Inline = InlineTemplate.bind({})
Inline.args = {
  inline: true,
}
