/* eslint-disable import/no-extraneous-dependencies */
import aze from './Button.vue'
import azeaze from "./ButtonGroup.vue";

export default {
  title: 'Button',
}

export const Default = () => ({
  components: { aze, azeaze},
  template: `
    <azeaze>
        <aze>loo</aze>
    </azeaze>
  `
})
