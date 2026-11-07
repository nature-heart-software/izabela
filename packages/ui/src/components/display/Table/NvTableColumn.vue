<script lang="ts">
import { defineComponent } from 'vue'
import { columnProps } from './table.shared'

/** Declarative column consumed by NvTable's header and row renderers. */
export default defineComponent({
  name: 'nv-table-column',
  props: columnProps,
  setup() {
    return () => null
  },
})
</script>
