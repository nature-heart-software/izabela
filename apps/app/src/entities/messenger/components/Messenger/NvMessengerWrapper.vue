<template>
  <div class="messengerWrapper">
    <div ref="moveableTarget" id="messengerWrapper" class="inline-flex overflow-auto">
      <slot></slot>
    </div>
    <Moveable
      className="opacity-0"
      ref="moveable"
      :target="['#messengerWrapper']"
      :draggable="true"
      :scalable="false"
      :rotatable="false"
      :resizable="true"
      :snappable="true"
      :bounds="{
        left: 0,
        right: viewport.width,
        top: 0,
        bottom: viewport.height,
      }"
      :elementGuidelines="[document.querySelector('body')]"
      :verticalGuidelines="[viewport.width / 2]"
      :snapDirections="{
        center: true,
        middle: true,
      }"
      :snapThreshold="50"
      @drag="onDrag"
      @resize="onResize"
    />
  </div>
</template>
<script lang="ts">
/* eslint-disable */
import { defineComponent, computed } from 'vue'
import Moveable from 'vue3-moveable'
import store from '@/store'

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
    transform: {
      type: String,
      default: null,
    },
  },
  mounted() {
    const moveableTargetEl = this.$refs.moveableTarget as HTMLDivElement | null
    const moveable = this.$refs.moveable as any
    if (moveableTargetEl) {
      moveableTargetEl.style.width = this.width + 'px'
      moveableTargetEl.style.minWidth = this.minWidth + 'px'
      moveableTargetEl.style.maxWidth = this.maxWidth + 'px'
      moveableTargetEl.style.height = this.height + 'px'
      moveableTargetEl.style.minHeight = this.minHeight + 'px'
      moveableTargetEl.style.maxHeight = this.maxHeight + 'px'
      if (this.transform) moveableTargetEl.style.transform = this.transform
    }
    moveable.updateTarget()
  },
  setup() {
    const viewport = computed(() => ({
      width: Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0),
      height: Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0),
    }))
    return {
      document,
      viewport,
      onDrag({ target, transform, width, height }: any) {
        target.style.transform = transform
        store.dispatch('messenger/setProperty', ['position.width', width])
        store.dispatch('messenger/setProperty', ['position.height', height])
        store.dispatch('messenger/setProperty', ['position.transform', transform])
      },
      onScale({ target, drag }: any) {
        target.style.transform = drag.transform
      },
      onResize({ target, width, height }: any) {
        target.style.width = `${width}px`
        target.style.height = `${height}px`
      },
    }
  },
})
</script>
<style lang="scss" scoped></style>
