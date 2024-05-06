/* eslint-disable import/no-extraneous-dependencies */
import { tokens } from '@/styles/tokens'
import { Story } from '@storybook/vue3'
import { props } from './icon.shared'
import * as Icons from '@packages/icons'
import { NvIcon } from '@/components'

export default {
    title: 'Icon',
    argTypes: {
        size: {
            defaultValue: props.size.default,
            options: Object.keys(tokens.fontSize).map((key) => Number(key)),
            control: 'inline-radio',
        },
        name: {
            defaultValue: 'github',
            options: Object.values(Icons).map(({ name }) => name.replace('nv-', '')),
            control: 'select',
        },
    },
}

const Template: Story = (args) => ({
    components: { NvIcon },
    setup() {
        return {
            args,
        }
    },
    template: `
      <NvIcon v-bind="args"></nv-text>
    `,
})

export const Default = Template.bind({})
Default.args = {}
