/* eslint-disable import/no-extraneous-dependencies */
import { tokens } from '@/styles/tokens'
import { StoryFn } from '@storybook/vue3'
import { props, typeValues } from '@/components/typography/Text/text.shared'
import { NvText } from '@/components'

export default {
    title: 'Text',
    argTypes: {
        content: {
            defaultValue: 'hello world',
            control: 'text',
        },
        size: {
            options: Object.keys(tokens.fontSize).map((key) => Number(key)),
            control: 'inline-radio',
            defaultValue: props.size.default,
        },
        type: {
            options: typeValues,
            control: 'inline-radio',
            defaultValue: props.type.default,
        },
        align: {
            control: 'text',
            defaultValue: '',
        },
    },
}

const Template: StoryFn = (args) => ({
    components: { NvText },
    setup() {
        return {
            args,
        }
    },
    template: `
      <NvText v-bind="args">{{ args.content }}</NvText>
    `,
})

export const Default = Template.bind({})
Default.args = {}
