<template>
  <div class="absolute inset-0 pointer-events-none">
    <template v-for="hitbox in hitboxStore.hitboxes" :key="hitbox.id">
      <div
        :data-debug-hitbox-id="hitbox.id"
        :style="{
          position: 'absolute',
          top: rem(hitbox.y),
          left: rem(hitbox.x),
          width: rem(hitbox.w),
          height: rem(hitbox.h),
          border: '1px solid red',
          pointerEvents: 'none',
        }"
      ></div>
    </template>
  </div>
</template>
<script lang="ts" setup>
import { useHitboxesStore } from '@/modules/vue-hitboxes/hitboxes.store'
import { rem } from 'polished'

const hitboxStore = useHitboxesStore()
</script>
