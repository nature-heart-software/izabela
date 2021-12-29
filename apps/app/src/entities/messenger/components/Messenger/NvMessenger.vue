<template>
  <div class="messenger bg-white/90 rounded grid p-5 gap-5 grid-rows-3">
    <nv-card></nv-card>
    <nv-card></nv-card>
    <nv-card>
      <label for="input">
        <input id="input" ref="input" @click="$event.target.focus()" />
      </label>
    </nv-card>
  </div>
</template>
<script lang="ts">
import { defineComponent } from 'vue'
import { NvCard } from '@/core/components'

export default defineComponent({
  name: 'nv-messenger',
  components: {
    NvCard,
  },
})
</script>
<style lang="scss" scoped>
.messenger {
  display: inline-block;
  min-width: 768px;
  min-height: 200px;
}
</style>
