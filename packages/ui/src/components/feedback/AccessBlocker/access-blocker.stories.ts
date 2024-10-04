/* eslint-disable import/no-extraneous-dependencies */
import { StoryFn } from '@storybook/vue3'
import { NvCard, NvText } from '@/components'
import NvAccessBlocker from './NvAccessBlocker.vue'

export default {
  title: 'AccessBlocker',
  argTypes: {
    reason: {
      defaultValue: 'Not enough hats.',
      control: 'textarea',
    },
  },
}

const Template: StoryFn = (args) => ({
  components: { NvAccessBlocker, NvCard, NvText },
  setup() {
    return {
      args,
    }
  },
  template: `
      <NvCard>
      <NvAccessBlocker v-bind="args">
        <NvText>
          Lorem ipsum dolor sit amet, consectetur adipisicing elit. Assumenda cupiditate expedita modi
          odit sapiente. Alias beatae culpa ex laudantium molestias mollitia optio perspiciatis,
          praesentium quae, quas quo sint unde voluptas?
        </NvText>
      </NvAccessBlocker>
      </NvCard>
    `,
})

export const Default = Template.bind({})
Default.args = {
  allowed: false,
}
