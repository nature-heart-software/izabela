<template>
  <div ref="el">
    <slot></slot>
  </div>
</template>
<script lang="ts" setup>
import { Ref, ref } from 'vue'
import { provideVirtualListContainerContext } from '@/components/miscellaneous/VirtualList/virtual-list.shared'

const el = ref() as Ref<HTMLDivElement>

provideVirtualListContainerContext({
  container: el,
})
</script>
