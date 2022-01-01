<template>
  <div class="messengerWrapper">
    <div ref="moveableTarget" id="messengerWrapper" class="inline-flex">
      <slot></slot>
    </div>
    <Moveable
      className="opacity-0"
      ref="moveable"
      :target="['#messengerWrapper']"
      :draggable="true"
      :scalable="false"
      :rotatable="false"
      :resizable="false"
      :snappable="true"
      :bounds="{
        left: 12,
        right: viewport.width - 12,
        top: 12,
        bottom: viewport.height - 12,
      }"
      :elementGuidelines="[document.querySelector('body')]"
      :verticalGuidelines="[viewport.width / 2]"
      :snapDirections="{
        center: true,
        middle: true,
      }"
      :snapThreshold="40"
      @drag="onDrag"
    />
  </div>
</template>
<script lang="ts">
/* eslint-disable */
import { defineComponent, computed } from 'vue'
import Moveable from 'vue3-moveable'
import store from '@/store'
import { debounce } from 'lodash'

export default defineComponent({
  name: 'nv-messenger-wrapper',
  components: { Moveable },
  props: {
    width: {
      type: Number,
      default: null,
    },
    minWidth: {
      type: Number,
      default: null,
    },
    maxWidth: {
      type: Number,
      default: null,
    },
    height: {
      type: Number,
      default: null,
    },
    minHeight: {
      type: Number,
      default: null,
    },
    maxHeight: {
      type: Number,
      default: null,
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
      if (this.width) moveableTargetEl.style.width = this.width + 'px'
      if (this.minWidth) moveableTargetEl.style.minWidth = this.minWidth + 'px'
      if (this.maxWidth) moveableTargetEl.style.maxWidth = this.maxWidth + 'px'
      if (this.height) moveableTargetEl.style.height = this.height + 'px'
      if (this.minHeight) moveableTargetEl.style.minHeight = this.minHeight + 'px'
      if (this.maxHeight) moveableTargetEl.style.maxHeight = this.maxHeight + 'px'
      if (this.transform) moveableTargetEl.style.transform = this.transform
    }
    moveable.updateTarget()
  },
  setup() {
    const viewport = computed(() => ({
      width: Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0),
      height: Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0),
    }))
    const saveTransformPosition = debounce((transform) => {
      store.dispatch('messenger/setProperty', ['persisted.position.transform', transform])
    }, 1000)
    return {
      document,
      viewport,
      onDrag({ target, transform }: any) {
        target.style.transform = transform
        saveTransformPosition(transform)
      },
    }
  },
})
</script>
<style lang="scss" scoped></style>
