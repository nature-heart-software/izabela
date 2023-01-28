<template>
  <div ref="componentRef" :data-hitbox-id="id">
    <slot/>
  </div>
</template>
<script lang="ts" setup>
import { v4 as uuid } from 'uuid'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { throttle } from 'lodash'
import { useIntersectionObserver, useMutationObserver, useResizeObserver } from '@vueuse/core'
import { useHitboxesStore } from '@/modules/vue-hitboxes/hitboxes.store'

const hitboxesStore = useHitboxesStore()

const componentRef = ref()
const id = uuid()
const hitboxes = ref({
  id,
  x: 0,
  y: 0,
  w: 0,
  h: 0,
})
const onHitboxUpdate = () => {
  // console.log('hitbox update', hitboxes.value, componentRef.value)
  if (componentRef.value) {
    console.log('adding', id)
    hitboxesStore.addHitbox({ ...hitboxes.value })
  } else {
    hitboxesStore.removeHitbox(hitboxes.value.id)
  }
}
const updateHitbox = throttle(() => {
  if (componentRef.value) {
    const bounds = componentRef.value.getBoundingClientRect()
    hitboxes.value.x = bounds.x
    hitboxes.value.y = bounds.y
    hitboxes.value.w = bounds.width
    hitboxes.value.h = bounds.height
  }
}, 250, { leading: true, trailing: true })

useIntersectionObserver(componentRef, updateHitbox)
useMutationObserver(componentRef, updateHitbox, { attributes: true })
useResizeObserver(componentRef, updateHitbox)

onBeforeUnmount(() => {
  hitboxesStore.removeHitbox(hitboxes.value.id)
})
onMounted(() => {
  updateHitbox()
})
watch(
  hitboxes.value,
  onHitboxUpdate,
  { deep: true },
)
</script>
