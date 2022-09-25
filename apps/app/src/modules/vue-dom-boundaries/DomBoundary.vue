<template>
  <div ref="componentRef">
    <slot />
  </div>
</template>
<script lang="ts" setup>
import { v4 as uuid } from 'uuid'
import { onBeforeUnmount, ref, watch } from 'vue'
import { throttle } from 'lodash'
import { useIntersectionObserver, useMutationObserver, useResizeObserver } from '@vueuse/core'
import { useDomBoundariesStore } from '@/modules/vue-dom-boundaries/dom-boundaries.store'

const domBoundariesStore = useDomBoundariesStore()

const componentRef = ref()
const boundaries = ref({
  id: uuid(),
  x: 0,
  y: 0,
  w: 0,
  h: 0,
})
const updateBoundary = throttle(() => {
  if (componentRef.value) {
    const bounds = componentRef.value.getBoundingClientRect()
    boundaries.value.x = bounds.x
    boundaries.value.y = bounds.y
    boundaries.value.w = bounds.width
    boundaries.value.h = bounds.height
  }
}, 250)

useIntersectionObserver(componentRef, updateBoundary)
useMutationObserver(componentRef, updateBoundary, { attributes: true })
useResizeObserver(componentRef, updateBoundary)

onBeforeUnmount(() => {
  domBoundariesStore.removeBoundary(boundaries.value.id)
})

watch(
  boundaries.value,
  () => {
    domBoundariesStore.addBoundary({ ...boundaries.value })
  },
  { deep: true },
)
</script>
