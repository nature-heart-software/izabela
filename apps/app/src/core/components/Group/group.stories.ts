/* eslint-disable import/no-extraneous-dependencies */
import { Story } from '@storybook/vue3'
import tokens from '@/styles/tokens'
import NvGroup from './NvGroup.vue'
import NvButton from '../Button/NvButton.vue'
import { props, justifyValues, alignValues, directionValues } from './group.shared'

export default {
  title: 'Group',
  component: NvGroup,

  argTypes: {
    spacing: {
      options: Object.keys(tokens.spacing).map(Number),
      control: 'inline-radio',
      defaultValue: props.spacing.default,
    },
    justify: {
      options: justifyValues,
      control: 'inline-radio',
      defaultValue: props.justify.default,
    },
    align: {
      options: alignValues,
      control: 'inline-radio',
      defaultValue: props.align.default,
    },
    direction: {
      options: directionValues,
      control: 'inline-radio',
      defaultValue: props.direction.default,
    },
    grow: {
      control: 'boolean',
      defaultValue: props.grow.default,
    },
    noWrap: {
      control: 'boolean',
      defaultValue: props.noWrap.default,
    },
  },
}

const Template: Story = (args) => ({
  components: { NvGroup, NvButton },
  setup() {
    return {
      args,
    }
  },
  template: `
      <NvGroup v-bind="args" :style="{height: '300px'}">
        <NvButton class="!h-auto">1</NvButton>
        <NvButton class="!h-auto">2</NvButton>
        <NvButton class="!h-auto">3</NvButton>
      </NvGroup>`,
})

export const Default = Template.bind({})
Default.args = {}
