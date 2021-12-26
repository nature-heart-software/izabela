<template>
  <div class="messengerWrapper">
    <div id="messengerWrapper" class="inline-flex overflow-auto" :style="{
      height: height + 'px',
      minHeight: minHeight + 'px',
      maxHeight: maxHeight + 'px',
      width: width + 'px',
      minWidth: minWidth + 'px',
      maxWidth: maxWidth + 'px',
    }">
      <slot></slot>
    </div>
    <Moveable
      :target="['#messengerWrapper']"
      :draggable="true"
      :scalable="false"
      :rotatable="false"
      :resizable="true"
      :snappable="true"
      :bounds="{ left: 0, right: viewport.width, top: 0, bottom: viewport.height }"
      @drag="onDrag"
      @resize="onResize"
    />
  </div>
</template>
<script lang="ts">
/* eslint-disable */
import { defineComponent, computed } from 'vue';
import Moveable from 'vue3-moveable';

export default defineComponent({
  name: 'nv-messenger-wrapper',
  components: { Moveable },
  props: {
    width: {
      type: Number,
      default: 100,
    },
    minWidth: {
      type: Number,
      default: 0,
    },
    maxWidth: {
      type: Number,
      default: Infinity,
    },
    height: {
      type: Number,
      default: 100,
    },
    minHeight: {
      type: Number,
      default: 0,
    },
    maxHeight: {
      type: Number,
      default: Infinity,
    },
  },
  setup() {
    const viewport = computed(() => ({
      width: Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0),
      height: Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0),
    }));
    return {
      viewport,
      onDrag({ target, transform }: any) {
        target.style.transform = transform;
      },
      onScale({ target, drag }: any) {
        target.style.transform = drag.transform;
      },
      onResize({target, width, height}: any) {
        target.style.width = `${width}px`;
        target.style.height = `${height}px`;
      },
    }
  },
})
</script>
<style lang="scss" scoped>
</style>
