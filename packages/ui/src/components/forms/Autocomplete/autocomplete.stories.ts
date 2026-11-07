import { css } from '@/styled-system/css'
/* eslint-disable import/no-extraneous-dependencies */
import { StoryFn } from '@storybook/vue3'
import { NvAutocomplete, NvInput } from '@/components'
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

const Template: StoryFn = (args) => ({
  components: { NvAutocomplete, NvInput },
  setup() {
    return {
      css,
      inputValue: ref(),
      data: ref(voices),
      args,
    }
  },
  template: `
      <NvAutocomplete v-bind="args" :data="data" valueKey="voicemodel_uuid">
      <template #reference>
        <NvInput v-model="inputValue" :class="css({'width':'100%'})"/>
      </template>
      <template #default="{ item }">
        <div :class="css({'height':'7','display':'flex','alignItems':'center'})">
          {{ item.display_name }}
        </div>
      </template>
      </NvAutocomplete>
    `,
})

export const Default = Template.bind({})
Default.args = {
  autoScrollValue: '42b79bb6-0b41-44dd-9824-e840d336c343',
  visible: true,
}
