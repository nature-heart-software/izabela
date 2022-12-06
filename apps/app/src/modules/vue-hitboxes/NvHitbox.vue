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
import { useHitboxesStore } from '@/modules/vue-hitboxes/hitboxes.store'

const hitboxesStore = useHitboxesStore()

const componentRef = ref()
const hitboxes = ref({
  id: uuid(),
  x: 0,
  y: 0,
  w: 0,
  h: 0,
})
const updateHitbox = throttle(() => {
  if (componentRef.value) {
    const bounds = componentRef.value.getBoundingClientRect()
    hitboxes.value.x = bounds.x
    hitboxes.value.y = bounds.y
    hitboxes.value.w = bounds.width
    hitboxes.value.h = bounds.height
  }
}, 250)

useIntersectionObserver(componentRef, updateHitbox)
useMutationObserver(componentRef, updateHitbox, { attributes: true })
useResizeObserver(componentRef, updateHitbox)

onBeforeUnmount(() => {
  hitboxesStore.removeHitbox(hitboxes.value.id)
})

watch(
  hitboxes.value,
  () => {
    hitboxesStore.addHitbox({ ...hitboxes.value })
  },
  { deep: true },
)
</script>
