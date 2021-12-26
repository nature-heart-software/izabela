/* eslint-disable import/no-extraneous-dependencies */
import { ref } from 'vue'
import NVTable from './NVTable.vue'
import NVTableColumn from './NVTableColumn.vue'

export default {
  title: 'Table',
}

const Template = (args) => ({
  components: { NVTable, NVTableColumn },
  setup() {
    return {
      data: ref([
        {
          date: '2016-05-03',
          name: 'Tom',
          address: 'No. 189, Grove St, Los Angeles',
        },
        {
          date: '2016-05-02',
          name: 'Tom',
          address: 'No. 189, Grove St, Los Angeles',
        },
        {
          date: '2016-05-04',
          name: 'Tom',
          address: 'No. 189, Grove St, Los Angeles',
        },
        {
          date: '2016-05-01',
          name: 'Tom',
          address: 'No. 189, Grove St, Los Angeles',
        },
      ]),
      ...args,
    }
  },
  template:
    args.template ||
    `
      <NVTable
        style="width: 100%"
        :data="data"
      >
        <NVTableColumn prop="date" label="Date" width="180" />
        <NVTableColumn prop="name" label="Name" width="180" />
        <NVTableColumn prop="address" label="Address" fixed="right" />
      </NVTable>
      `,
})

export const Default = Template.bind({})
Default.args = {}
