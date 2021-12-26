<template>
  <div class="messenger">
    <label for="input">
      <input id="input" ref="input" @click="$event.target.focus()">
    </label>
  </div>
</template>
<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'nv-messenger',
})
</script>
<style lang="scss" scoped>
.messenger {
  display: inline-block;
  min-width: 768px;
  min-height: 200px;
  background-color: red;
}
</style>

tricot Jodeki instrumental - to your excellent time
Image
