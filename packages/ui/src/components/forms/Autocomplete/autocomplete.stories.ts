/* eslint-disable import/no-extraneous-dependencies */
import { Story } from '@storybook/vue3'
import { NvAutocomplete } from '@/components'
import { ref } from 'vue'
import voices from '@/mocks/voices.json'
import { props, sizeValues } from './autocomplete.shared'

export default {
  title: 'Autocomplete',
  argTypes: {
    size: {
      defaultValue: props.size.default,
      control: 'inline-radio',
      options: sizeValues,
    },
  },
}

const Template: Story = (args) => ({
  components: { NvAutocomplete },
  setup() {
    return {
      data: ref(voices),
      args,
    }
  },
  template: `
      <NvAutocomplete v-bind="args" :data="data" valueKey="voicemodel_uuid">
      <template #default="{ item }">
        <div class="h-7 flex items-center">
          {{ item.display_name }}
        </div>
      </template>
      </NvAutocomplete>
    `,
})

export const Default = Template.bind({})
Default.args = {
  autoScrollValue: '42b79bb6-0b41-44dd-9824-e840d336c343',
}
