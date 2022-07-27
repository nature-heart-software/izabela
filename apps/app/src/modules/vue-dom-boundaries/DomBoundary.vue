<template>
  <div ref="componentRef">
    <slot/>
  </div>
</template>
<script lang="ts" setup>
import { useStore } from 'vuex'
import { v4 as uuid } from 'uuid'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { throttle } from 'lodash'

const store = useStore()

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
const resizeObserver = new ResizeObserver(updateBoundary)
const intersectionObserver = new IntersectionObserver(updateBoundary)
const mutationObserver = new MutationObserver(updateBoundary)
onMounted(() => {
  if (componentRef.value) {
    resizeObserver.observe(componentRef.value)
    intersectionObserver.observe(componentRef.value)
    mutationObserver.observe(componentRef.value, { attributes: true })
  }
})
onBeforeUnmount(() => {
  if (componentRef.value) {
    resizeObserver.unobserve(componentRef.value)
    intersectionObserver.unobserve(componentRef.value)
    mutationObserver.disconnect()
    if (store && store.hasModule('dom-boundaries')) {
      store.dispatch('dom-boundaries/removeBoundary', boundaries.value.id)
    }
  }
})
watch(
  boundaries.value,
  () => {
    if (store && store.hasModule('dom-boundaries')) {
      store.dispatch('dom-boundaries/addBoundary', { ...boundaries.value })
    }
  },
  { deep: true },
)
</script>
