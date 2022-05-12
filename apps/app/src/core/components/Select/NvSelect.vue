<template>
  <st-select v-bind="$props">
    <div class="nv-selectWrapper">
      <component
        v-bind:is="'wrapped-component'"
        :filterable="true"
        :model-value="modelValue"
        :popper-append-to-body="false"
        v-bind="$attrs"
        @update:model-value="$emit('update:model-value', $event)"
      >
        <template v-for="(_, slot) of $slots" v-slot:[slot]="scope">
          <slot :name="slot" v-bind="scope || {}" />
        </template>
      </component>
      <nv-icon :size="iconSize" class="nv-select__icon" name="direction" />
    </div>
  </st-select>
</template>
<script lang="ts">
import { defineComponent, ref } from 'vue'
import { ElSelect as WrappedComponent } from 'element-plus'
import 'element-plus/lib/components/select/style/css'
import { watchBoundary } from '@/modules/vue-dom-boundaries'
import theme from '@/styles/tokens'
import { StSelect } from './select.styled'
import { props, Size } from './select.shared'
import NvIcon from '../Icon/NvIcon.vue'

watchBoundary('.el-select-dropdown')

export default defineComponent({
  name: 'nv-select',
  components: {
    StSelect,
    WrappedComponent,
    NvIcon,
  },
  props,
  setup() {
    return {
      input: ref(''),
      theme,
    }
  },
  computed: {
    iconSize() {
      const sizes: { [key in Size]: string } = {
        sm: '3',
        md: '5',
        lg: '5',
      }
      return sizes[this.size]
    },
  },
})
</script>
