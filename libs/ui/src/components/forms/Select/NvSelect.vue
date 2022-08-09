<template>
  <StSelect v-bind="props">
    <div class="nv-selectWrapper">
      <component
        :is="WrappedComponent"
        :filterable="true"
        :model-value="props.modelValue"
        :popper-append-to-body="false"
        v-bind="$attrs"
        @update:model-value="$emit('update:model-value', $event)"
      >
        <template v-for="(_, slot) of $slots" v-slot:[slot]="scope">
          <slot :name="slot" v-bind="scope || {}" />
        </template>
      </component>
      <NvIcon :size="iconSize" class="nv-select__icon" name="direction" />
    </div>
  </StSelect>
</template>
<script lang="ts" setup>
import { computed, defineProps } from 'vue'
import { ElSelect as WrappedComponent } from 'element-plus'
import 'element-plus/lib/components/select/style/css'
import tokens from '@/styles/tokens'
import { StSelect } from './select.styled'
import { props as propsDefinition, Size } from './select.shared'
import NvIcon from '@/components/typography/Icon/NvIcon.vue'

const props = defineProps(propsDefinition)

const iconSize = computed(() => {
  const sizes: Record<Size, keyof typeof tokens.spacing> = {
    sm: 3,
    md: 5,
    lg: 5,
  }
  return sizes[props.size]
})
</script>
<script lang="ts">
// eslint-disable-next-line
// import { watchBoundary } from '@/modules/vue-dom-boundaries'
//
// watchBoundary('.el-select-dropdown')
export default {}
</script>
