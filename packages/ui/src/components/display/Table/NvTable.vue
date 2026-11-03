<script lang="ts">
import {
  defineComponent,
  Fragment,
  h,
  inject,
  mergeProps,
  unref,
  type VNode,
  type VNodeChild,
} from 'vue'
import NvTableColumn from './NvTableColumn.vue'
import {
  tableProps,
  type TableColumn,
  type TableCellScope,
} from './table.shared'
import { table, tableCell } from './table.panda'
import { themeVariables } from '@/utils/panda'

function columnsFrom(nodes: VNode[]): VNode[] {
  return nodes.flatMap((node) => {
    if (node.type === Fragment) return columnsFrom(node.children as VNode[])
    return node.type === NvTableColumn ? [node] : []
  })
}
const dimension = (value: string | number | undefined) =>
  value === undefined
    ? undefined
    : /^\d+(\.\d+)?$/.test(String(value))
    ? `${value}px`
    : String(value)

/** Native table with declarative columns and header/default scoped slots. */
export default defineComponent({
  name: 'nv-table',
  inheritAttrs: false,
  props: tableProps,
  setup(props, { attrs, slots }) {
    const theme = inject<unknown>('theme', undefined)
    return () => {
      const columns = columnsFrom(slots.default?.() ?? []).map((node) => {
        const column: TableColumn = {
          property: node.props?.prop ?? '',
          label: node.props?.label ?? '',
          width: node.props?.width,
          minWidth: node.props?.minWidth ?? node.props?.['min-width'],
          fixed: node.props?.fixed ?? false,
          align: node.props?.align ?? 'left',
        }
        const columnSlots = node.children as Record<
          string,
          (scope: any) => VNodeChild
        > | null
        const fixed =
          column.fixed === true || node.props?.fixed === ''
            ? 'left'
            : column.fixed || undefined
        return {
          column,
          slots: columnSlots,
          class: tableCell({ align: column.align, fixed }),
        }
      })
      return h(
        'table',
        mergeProps(attrs, {
          class: table(),
          style: themeVariables(unref(theme)),
        }),
        [
          slots.caption ? h('caption', slots.caption()) : null,
          h(
            'colgroup',
            columns.map(({ column }) =>
              h('col', {
                style: {
                  width: dimension(column.width),
                  minWidth: dimension(column.minWidth),
                },
              }),
            ),
          ),
          props.showHeader
            ? h('thead', [
                h(
                  'tr',
                  columns.map(
                    (
                      { column, slots: columnSlots, class: cellClass },
                      $index,
                    ) =>
                      h(
                        'th',
                        { scope: 'col', class: cellClass },
                        columnSlots?.header?.({ column, $index }) ??
                          column.label,
                      ),
                  ),
                ),
              ])
            : null,
          h(
            'tbody',
            props.data.length
              ? props.data.map((row, $index) =>
                  h(
                    'tr',
                    {
                      key:
                        typeof props.rowKey === 'function'
                          ? props.rowKey(row)
                          : props.rowKey
                          ? row[props.rowKey]
                          : $index,
                    },
                    columns.map(
                      ({ column, slots: columnSlots, class: cellClass }) => {
                        const scope: TableCellScope = { row, column, $index }
                        const value = column.property
                          .split('.')
                          .reduce((value, key) => value?.[key], row as any)
                        return h(
                          'td',
                          { class: cellClass },
                          columnSlots?.default?.(scope) ??
                            (value == null ? '' : String(value)),
                        )
                      },
                    ),
                  ),
                )
              : [
                  h('tr', [
                    h(
                      'td',
                      {
                        colspan: Math.max(columns.length, 1),
                        'data-empty': '',
                      },
                      slots.empty?.() ?? props.emptyText,
                    ),
                  ]),
                ],
          ),
        ],
      )
    }
  },
})
</script>
