<template>
  <div class="messengerWrapper">
    <DomBoundary id="moveable" ref="moveableTarget" class="inline-flex">
      <div
        ref="messenger"
        class="messenger bg-gray-10/95 rounded grid p-4 gap-4 grid-rows-3 grid-rows-none"
      >
        <!-- Top -->
        <NvGroup :spacing="4">
          <NvMessengerLinksBar />
          <NvGroup class="flex !flex-1 justify-end space-x-4 moveable-handle cursor-all-scroll">
            <NvCard class="flex-1 min-h-8" size="xs">
              <div class="inline-flex space-x-2">
                <template v-if="settingsStore.debugMode">
                  <NvButton icon-name="redo" size="sm" @click="reload" />
                  <NvButton icon-name="brackets-curly" size="sm" @click="openDevTools" />
                </template>
              </div>
            </NvCard>
            <NvCard size="xs">
              <div class="inline-flex items-center space-x-2">
                <NvButton icon-name="question-circle" size="sm" />
                <NvDivider class="h-3" direction="vertical" />
                <NvButton icon-name="comment-alt-lines" size="sm" />
                <NvDivider class="h-3" direction="vertical" />
                <NvButton
                  icon-name="setting"
                  size="sm"
                  @click="navigateTo({ name: 'settings-overview' })"
                />
              </div>
            </NvCard>
            <NvCard class="inline-flex" size="sm">
              <div class="inline-flex space-x-2">
                <!-- <NvButton size="xs" type="plain" icon-name="minus"/>
                <NvButton size="xs" type="plain" icon-name="square-full"/> -->
                <NvButton icon-name="times" size="xs" type="plain" @click="hide" />
              </div>
            </NvCard>
          </NvGroup>
        </NvGroup>

        <!-- Middle -->
        <NvGroup justify="between">
          <NvMessengerAudioBar />
          <NvMessengerMessageBar />
        </NvGroup>

        <!-- Bottom -->
        <div>
          <NvMessengerInputBar />
        </div>
      </div>
    </DomBoundary>
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
      :snapThreshold="40"
      :snappable="true"
      :verticalGuidelines="[viewport.width / 2]"
      className="opacity-0"
      target="#moveable"
      @drag="onDrag"
    />
  </div>
</template>
<script lang="ts" setup>
import { ComponentPublicInstance, computed, defineProps, onMounted, provide, ref } from 'vue'
import Moveable from 'vue3-moveable'
import { NvButton, NvCard, NvDivider, NvGroup } from '@packages/ui'
import { RouteLocationRaw, useRouter } from 'vue-router'
import DomBoundary from '@/modules/vue-dom-boundaries/DomBoundary.vue'
import { useRouterViewPopover } from '@/features/router/hooks'
import { useMessengerStore } from '@/teams/messenger/store'
import { useSettingsStore } from '@/features/settings/store'
import NvMessengerInputBar from '@/teams/messenger/components/NvMessengerInputBar.vue'
import NvMessengerAudioBar from '@/teams/messenger/components/NvMessengerAudioBar.vue'
import NvMessengerMessageBar from '@/teams/messenger/components/NvMessengerMessageBar.vue'
import NvMessengerLinksBar from '@/teams/messenger/components/NvMessengerLinksBar.vue'

const settingsStore = useSettingsStore()

const messengerStore = useMessengerStore()
const { ElectronMessengerWindow } = window
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
  router.push(location)
  settingsPopover.popover.value?.show()
}
provide('messenger', {
  navigateTo,
})
const viewport = computed(() => ({
  width: Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0),
  height: Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0),
}))

const savePosition = (event: any) => {
  const { width, height, translate, transform } = event
  messengerStore.$patch({
    position: {
      width,
      height,
      translate,
      transform,
    },
  })
}

const openDevTools = () => {
  ElectronMessengerWindow.openDevTools()
}

const hide = () => {
  ElectronMessengerWindow.hide()
}

const reload = () => {
  window.location.reload()
}

const onDrag = (event: any) => {
  const { target, transform } = event
  target.style.transform = transform
  savePosition(event)
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

  /* This fixes focus on focusable elements. Focus won't work unless
   * the window has been dragged once with draggable for some reasons
   * */
  moveable.value.request('draggable', { deltaX: 0, deltaY: -1 }, true)
  setTimeout(() => {
    moveable.value.request('draggable', { deltaX: 0, deltaY: 1 }, true)
  }, 1000)
})
</script>
<style lang="scss" scoped>
.messenger {
  min-width: 768px;
}
</style>
