<template>
  <div
    v-if="virtualizer"
    :style="{
      height: rem(virtualizer.getTotalSize()),
    }"
    class="relative"
  >
    <template
      v-for="item in virtualizer.getVirtualItems()"
      :key="`${item.index}-${item.key}`"
    >
      <div
        :style="{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: `${item.size}px`,
          transform: `translateY(${item.start}px)`,
        }"
      >
        <slot name="default" v-bind="{ ...item }" />
      </div>
    </template>
  </div>
</template>
<script lang="ts" setup>
import { useVirtualizer } from '@/hooks/virtual-list'
import {
  injectVirtualListContainerContext,
  props as propsDefinition,
} from '@/components/miscellaneous/VirtualList/virtual-list.shared'
import { rem } from 'polished'
import tokens from '@/styles/tokens'
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { Virtualizer } from '@tanstack/virtual-core'

const emit = defineEmits(['visible', 'hidden', 'change'])
const props = defineProps(propsDefinition)
const context = injectVirtualListContainerContext()
const virtualizerOptions = computed(() => ({
  getScrollElement: () => context?.container.value,
  estimateSize: () => tokens.spacing[7],
  enableSmoothScroll: false,
  ...props.options,
  count: props.count,
  onChange: (instance: Virtualizer) => {
    emit('change')
    if (props.options?.onChange) {
      props.options.onChange(instance)
    }
  },
}))
const virtualizer = useVirtualizer(virtualizerOptions)
const scrollToIndex: typeof virtualizer.value.scrollToIndex = (...args) => {
  setTimeout(() => {
    return virtualizer.value.scrollToIndex(...args)
  })
}
defineExpose({
  scrollToIndex,
})
onMounted(() => {
  setTimeout(() => {
    emit('visible')
  })
})
onBeforeUnmount(() => {
  emit('hidden')
})
</script>
