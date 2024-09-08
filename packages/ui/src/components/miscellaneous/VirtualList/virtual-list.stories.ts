/* eslint-disable import/no-extraneous-dependencies */
import { StoryFn } from '@storybook/vue3'
import { NvVirtualList, NvVirtualListContainer } from '@/components'
import { ref } from 'vue'
import voices from '@/mocks/voices.json'

export default {
    title: 'VirtualList',
}

const Template: StoryFn = (args) => ({
    components: { NvVirtualList, NvVirtualListContainer },
    setup() {
        return {
            inputValue: ref(),
            data: ref(voices),
            args,
        }
    },
    template: `
      <NvVirtualListContainer :style="{
     height: '200px',
     overflowY: 'auto',
     marginRight: '10px',
    }">
      <NvVirtualList v-bind="args" :count="1000">
        <template #default="{ index }">
          {{ index }}
        </template>
      </NvVirtualList>
      </NvVirtualListContainer>
    `,
})

export const Default = Template.bind({})
Default.args = {}
