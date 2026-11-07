import type { ExtractPropTypes, PropType } from 'vue'

export const tableProps = {
  data: { type: Array as PropType<Record<string, any>[]>, default: () => [] },
  showHeader: { type: Boolean, default: true },
  emptyText: { type: String, default: 'No Data' },
  rowKey: {
    type: [String, Function] as PropType<
      string | ((row: Record<string, any>) => string | number)
    >,
  },
}

export const columnProps = {
  prop: { type: String, default: '' },
  label: { type: String, default: '' },
  width: { type: [String, Number], default: undefined },
  minWidth: { type: [String, Number], default: undefined },
  fixed: {
    type: [Boolean, String] as PropType<boolean | 'left' | 'right'>,
    default: false,
  },
  align: {
    type: String as PropType<'left' | 'center' | 'right'>,
    default: 'left',
  },
}

export type TableProps = ExtractPropTypes<typeof tableProps>
export type TableColumnProps = ExtractPropTypes<typeof columnProps>

/** Column metadata provided to the header and row scoped slots. */
export type TableColumn = Omit<TableColumnProps, 'prop'> & { property: string }
/** Row scope preserves the column composition API used by table consumers. */
export type TableCellScope = {
  row: Record<string, any>
  column: TableColumn
  $index: number
}
