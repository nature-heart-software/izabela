/* eslint-disable import/no-extraneous-dependencies */
import NvGroup from './NvGroup.vue'
import NvButton from '../Button/NvButton.vue'

export default {
  title: 'Group',
  component: NvGroup,
}

const Template = (args) => ({
  components: { NvGroup, NvButton },
  setup() {
    return {
      args,
    }
  },
  template:
    args.template ||
    `
      <nv-group v-bind="args">
        <nv-button squared>1</nv-button>
        <nv-button squared>2</nv-button>
        <nv-button squared>3</nv-button>
      </nv-group>`,
})

export const Default = Template.bind({})
Default.args = {}
