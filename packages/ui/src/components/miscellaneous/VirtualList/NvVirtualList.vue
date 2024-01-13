<template>
  <div
    v-if="virtualizer"
    :key="props.count"
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
import { useVirtualizer } from '@/hooks/useVirtualizer'
import { Virtualizer } from '@tanstack/virtual-core'
import {
  injectVirtualListContainerContext,
  props as propsDefinition,
} from '@/components/miscellaneous/VirtualList/virtual-list.shared'
import { rem } from 'polished'
import tokens from '@/styles/tokens'
import { computed, onBeforeUnmount, onMounted } from 'vue'

const emit = defineEmits(['visible', 'hidden', 'change'])
const props = defineProps(propsDefinition)
const context = injectVirtualListContainerContext()
const virtualizerOptions = computed(() => ({
  getScrollElement: () => context?.container.value as any | null,
  estimateSize: () => tokens.spacing[7],
  enableSmoothScroll: false,
  overscan: 5,
  ...props.options,
  count: props.count,
  onChange: (instance: Virtualizer<Element, Element>) => {
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
const scrollToOffset: typeof virtualizer.value.scrollToOffset = (...args) => {
  setTimeout(() => {
    return virtualizer.value.scrollToOffset(...args)
  })
}
defineExpose({
  scrollToIndex,
  scrollToOffset,
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
