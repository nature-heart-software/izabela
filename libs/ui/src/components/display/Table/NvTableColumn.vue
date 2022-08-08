<template>
  <component v-bind:is="'wrapped-component'" v-bind="$attrs">
    <template v-for="(_, slot) of $slots" v-slot:[slot]="scope">
      <slot :name="slot" v-bind="scope || {}" />
    </template>
  </component>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { ElTableColumn as WrappedComponent } from 'element-plus'
import 'element-plus/lib/components/table-column/style/css'

export default defineComponent<InstanceType<typeof WrappedComponent>['$props']>({
  name: 'nv-table-column',
  components: { WrappedComponent },
})
</script>
