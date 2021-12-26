/* eslint-disable import/no-extraneous-dependencies */
import Table from './Table.vue'
import TableColumn from './TableColumn.vue'

export default {
  title: 'Table',
  components: { Table, TableColumn },
  data() {
    return {
      tableData: [
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
      ],
    }
  },
}

export const Default = () => ({
  render() {
    return (
      <Table
        style="width: 100%"
        data={[
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
        ]}
      >
        <TableColumn prop="date" label="Date" width="180" />
        <TableColumn prop="name" label="Name" width="180" />
        <TableColumn prop="address" label="Address" fixed="right" />
      </Table>
    )
  },
})
