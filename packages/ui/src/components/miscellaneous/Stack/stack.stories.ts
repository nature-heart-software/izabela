/* eslint-disable import/no-extraneous-dependencies */
import { Story } from '@storybook/vue3'
import tokens from '@/styles/tokens'
import { alignValues, justifyValues, props } from './stack.shared'
import { NvButton, NvStack } from '@/components'

export default {
    title: 'Stack',
    component: NvStack,
    argTypes: {
        spacing: {
            options: Object.keys(tokens.spacing).map(Number),
            control: 'inline-radio',
            defaultValue: props.spacing.default,
        },
        align: {
            options: alignValues,
            control: 'inline-radio',
            defaultValue: props.align.default,
        },
        justify: {
            options: justifyValues,
            control: 'inline-radio',
            defaultValue: props.justify.default,
        },
    },
}

const Template: Story = (args) => ({
    components: { NvStack, NvButton },
    setup() {
        return {
            args,
        }
    },
    template: `
      <NvStack v-bind="args" :style="{height: '300px'}">
      <NvButton class="!h-auto">1</NvButton>
      <NvButton class="!h-auto">2</NvButton>
      <NvButton class="!h-auto">3</NvButton>
      </NvStack>`,
})

export const Default = Template.bind({})
Default.args = {}
