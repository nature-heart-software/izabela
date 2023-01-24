/* eslint-disable import/no-extraneous-dependencies */
import { ref } from 'vue'
import { Story } from '@storybook/vue3'
import { props, sizeValues } from './number-input.shared'
import { NvNumberInput } from '@/components'

export default {
    title: 'Number Input',
    argTypes: {
        content: {
            defaultValue: 0,
            control: 'number',
        },
        placeholder: {
            defaultValue: 'Enter some text...',
            control: 'text',
        },
        size: {
            defaultValue: props.size.default,
            control: 'inline-radio',
            options: sizeValues,
        },
    },
}

const Template: Story = (args) => ({
    components: { NvNumberInput },
    setup() {
        return {
            args,
            inputValue: ref(args.content),
        }
    },
    template: `
      <NvNumberInput v-model="inputValue" v-bind="args"/>
    `,
})

export const Default = Template.bind({})
Default.args = {}
