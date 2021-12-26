/* eslint-disable import/no-extraneous-dependencies */
import { ref } from 'vue'
import NvTable from './NvTable.vue'
import NvTableColumn from './NvTable.vue'

export default {
  title: 'Table',
}

const Template = (args) => ({
  components: { NvTable, NvTableColumn },
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
      <NvTable
        style="width: 100%"
        :data="data"
      >
        <NvTableColumn prop="date" label="Date" width="180" />
        <NvTableColumn prop="name" label="Name" width="180" />
        <NvTableColumn prop="address" label="Address" fixed="right" />
      </NvTable>
      `,
})

export const Default = Template.bind({})
Default.args = {}
