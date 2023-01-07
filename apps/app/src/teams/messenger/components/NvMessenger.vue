<template>
  <div class="messengerWrapper">
    <NvHitbox id="moveable" ref="moveableTarget" class="inline-flex">
      <div
        ref="messenger"
        class="messenger bg-gray-10/95 rounded grid p-4 gap-4 grid-rows-3 grid-rows-none min-w-[768px]"
      >
        <!-- Top -->
        <NvGroup :spacing="4">
          <NvMessengerLinksBar />
          <NvGroup :spacing="4" class="!flex-1">
            <div class="moveable-handle cursor-all-scroll !flex-1">
              <NvMessengerHandleBar />
            </div>
            <NvMessengerNavigationBar />
          </NvGroup>
        </NvGroup>

        <!-- Middle -->
        <NvGroup :spacing="4" justify="between">
          <NvMessengerAudioBar />
          <NvMessengerMessageBar />
        </NvGroup>

        <!-- Bottom -->
        <NvGroup :spacing="4" grow>
          <NvMessengerInputBar />
        </NvGroup>
      </div>
    </NvHitbox>
    <Moveable
      ref="moveable"
      :bounds="{
        left: 12,
        right: viewport.width - 12,
        top: 12,
        bottom: viewport.height - 12,
      }"
      :dragTarget="doc.querySelector('.moveable-handle')"
      :draggable="true"
      :elementGuidelines="[doc.querySelector('body')]"
      :preventClickEventOnDrag="false"
      :resizable="false"
      :rotatable="false"
      :scalable="false"
      :snapDirections="{
        center: true,
        middle: true,
      }"
      :snapThreshold="16"
      :snappable="true"
      :verticalGuidelines="[viewport.width / 2]"
      className="opacity-0"
      target="#moveable"
      @drag="onDrag"
    />
  </div>
</template>
<script lang="ts" setup>
import { ComponentPublicInstance, computed, defineProps, onMounted, provide, ref, unref } from 'vue'
import Moveable from 'vue3-moveable'
import { NvGroup } from '@packages/ui'
import { RouteLocationRaw, useRouter } from 'vue-router'
import NvHitbox from '@/modules/vue-hitboxes/NvHitbox.vue'
import { useRouterViewPopover } from '@/features/router/hooks'
import { useMessengerStore } from '@/teams/messenger/store'
import NvMessengerInputBar from '@/teams/messenger/components/NvMessengerInputBar.vue'
import NvMessengerAudioBar from '@/teams/messenger/components/NvMessengerAudioBar.vue'
import NvMessengerMessageBar from '@/teams/messenger/components/NvMessengerMessageBar.vue'
import NvMessengerLinksBar from '@/teams/messenger/components/NvMessengerLinksBar.vue'
import NvMessengerHandleBar from '@/teams/messenger/components/NvMessengerHandleBar.vue'
import NvMessengerNavigationBar from '@/teams/messenger/components/NvMessengerNavigationBar.vue'
import { debounce } from 'lodash'

const messengerStore = useMessengerStore()
const props = defineProps({
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
})

const messenger = ref()

const moveable = ref()
const moveableTarget = ref()

const doc = document
const settingsPopover = useRouterViewPopover({
  popoverTarget: messenger,
  popoverOptions: {
    trigger: 'manual',
  },
})

const router = useRouter()
const navigateTo = (location: RouteLocationRaw) => {
  if (
    unref(settingsPopover.popover.value?.state)?.isShown &&
    typeof location === 'object' &&
    'name' in location &&
    router.currentRoute.value.name === location.name
  ) {
    settingsPopover.popover.value?.hide()
    return
  }
  router.push(location)
  settingsPopover.popover.value?.show()
}
const popover = computed(() => settingsPopover.popover.value)
const popoverState = computed<any>(() => popover.value?.state)
const isViewShown = computed(() => popoverState.value?.isShown)
provide('messenger', {
  navigateTo,
  isViewShown,
})

const viewport = computed(() => ({
  width: Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0),
  height: Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0),
}))

const savePosition = debounce((event: any) => {
  const { width, height, translate, transform } = event

  messengerStore.$patch({
    position: {
      width,
      height,
      translate,
      transform,
    },
  })
}, 1000)

const onDrag = (event: any) => {
  const { target, transform } = event
  target.style.transform = transform
  savePosition(event)
  settingsPopover.update()
}

onMounted(() => {
  const moveableTargetEl = (moveableTarget.value as ComponentPublicInstance)
    .$el as HTMLDivElement | null
  if (moveableTargetEl) {
    if (props.width) moveableTargetEl.style.width = `${props.width}px`
    if (props.minWidth) moveableTargetEl.style.minWidth = `${props.minWidth}px`
    if (props.maxWidth) moveableTargetEl.style.maxWidth = `${props.maxWidth}px`
    if (props.height) moveableTargetEl.style.height = `${props.height}px`
    if (props.minHeight) moveableTargetEl.style.minHeight = `${props.minHeight}px`
    if (props.maxHeight) moveableTargetEl.style.maxHeight = `${props.maxHeight}px`
    if (props.transform) moveableTargetEl.style.transform = props.transform
  }
  moveable.value.updateTarget()

  setTimeout(() => {
    if (!props.transform) {
      const rect = moveableTargetEl?.getBoundingClientRect()
      if (!rect) return
      const { width, height } = rect
      moveable.value.request(
        'draggable',
        {
          x: viewport.value.width / 2 - width / 2,
          y: viewport.value.height - height - 60,
        },
        true,
      )
    }
    /* This fixes focus on focusable elements. Focus won't work unless
     * the window has been dragged once with draggable for some reasons
     * */
    moveable.value.request('draggable', { deltaX: 0, deltaY: -1 }, true)
    setTimeout(() => {
      moveable.value.request('draggable', { deltaX: 0, deltaY: 1 }, true)
    }, 1000)
  }, 1000)
})
</script>
