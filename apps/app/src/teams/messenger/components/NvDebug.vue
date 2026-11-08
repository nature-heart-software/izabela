<template>
  <div
    :class="css({ position: 'absolute', inset: '0', pointerEvents: 'none' })"
  >
    <template v-for="hitbox in hitboxStore.hitboxes" :key="hitbox.id">
      <div
        :data-debug-hitbox-id="hitbox.id"
        :class="css({ border: '1px solid {colors.debug.hitbox.border}' })"
        :style="{
          position: 'absolute',
          top: rem(hitbox.y / pixelRatio),
          left: rem(hitbox.x / pixelRatio),
          width: rem(hitbox.w / pixelRatio),
          height: rem(hitbox.h / pixelRatio),
          pointerEvents: 'none',
        }"
      ></div>
    </template>
  </div>
</template>
<script lang="ts" setup>
import { css } from '@/styled-system/css'
import { useHitboxesStore } from '@/modules/vue-hitboxes/hitboxes.store'
import { rem } from 'polished'
import { useDevicePixelRatio } from '@vueuse/core'

const { pixelRatio } = useDevicePixelRatio()
const hitboxStore = useHitboxesStore()
</script>
