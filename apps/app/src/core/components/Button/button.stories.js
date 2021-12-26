/* eslint-disable import/no-extraneous-dependencies */
import NVButton from './NVButton.vue'
import NVButtonGroup from './NVButtonGroup.vue'

export default {
  title: 'Button',
}

export const Default = () => ({
  components: { NVButton, NVButtonGroup },
  template: `
    <NVButton>
        <NVButtonGroup>loo</NVButtonGroup>
    </NVButton>
  `,
})
