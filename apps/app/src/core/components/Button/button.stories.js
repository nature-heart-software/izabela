/* eslint-disable import/no-extraneous-dependencies */
import NvButton from './NvButton.vue'
import NvButtonGroup from './NvButtonGroup.vue'

export default {
  title: 'Button',
}

export const Default = () => ({
  components: { NvButton, NvButtonGroup },
  template: `
    <NVButton>
        <NVButtonGroup>loo</NVButtonGroup>
    </NVButton>
  `,
})
