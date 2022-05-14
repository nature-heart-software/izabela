/* eslint-disable import/no-extraneous-dependencies */
import NvCenter from './NvCenter.vue'
import NvButton from '../Button/NvButton.vue'

export default {
  title: 'Center',
  component: NvCenter,
}

const Template = (args) => ({
  components: { NvCenter, NvButton },
  setup() {
    return {
      args,
    }
  },
  template:
    args.template ||
    `
      <nv-center v-bind="args" class="bg-gray-10" :style="{height: '200px'}">
        <nv-button>centered</nv-button>
      </nv-center>`,
})

export const Default = Template.bind({})
Default.args = {}

export const Inline = Template.bind({})
Inline.args = {
  template: `
        <nv-center :inline="true">
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#000000"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
            >
                <path d="M19 12H6M12 5l-7 7 7 7" />
            </svg>
            &nbsp; submit a request
        </nv-center>
  `,
}
