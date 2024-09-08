/* eslint-disable import/no-extraneous-dependencies */
import { StoryFn } from '@storybook/vue3'
import { NvCard } from '@/components'
import { props, sizeValues } from './card.shared'

export default {
    title: 'Card',
    argTypes: {
        content: {
            defaultValue: 'hello world',
            control: 'text',
        },
        size: {
            defaultValue: props.size.default,
            control: 'inline-radio',
            options: sizeValues,
        },
    },
}

const Template: StoryFn = (args) => ({
    components: { NvCard },
    setup() {
        return {
            args,
        }
    },
    template: `
      <NvCard v-bind="args">{{ args.content }}</NvCard>
    `,
})

export const Default = Template.bind({})
Default.args = {}
