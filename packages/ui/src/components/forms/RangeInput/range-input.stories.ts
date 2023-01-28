/* eslint-disable import/no-extraneous-dependencies */
import { Story } from '@storybook/vue3'
import NvRangeInput from './NvRangeInput.vue'

export default {
    title: 'Range Input',
    argTypes: {
        value: { control: 'number', defaultValue: 0 },
    },
}

const Template: Story = (args) => ({
    components: { NvRangeInput },
    setup() {
        return {
            args,
        }
    },
    template: `
      <NvRangeInput v-model="args.value"/>
    `,
})

export const Default = Template.bind({})
Default.args = {}
