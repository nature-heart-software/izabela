<template>
  <div ref="portalTarget">
    <slot />
  </div>
</template>
<script lang="ts" setup>
import { provide, ref } from 'vue'
import { PORTAL_TARGET } from '@packages/ui'

const portalTarget = ref()
provide(PORTAL_TARGET, portalTarget)
</script>
