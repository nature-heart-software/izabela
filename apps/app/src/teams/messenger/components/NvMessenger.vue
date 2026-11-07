<template>
  <div class="messengerWrapper">
    <NvHitbox
      id="moveable"
      ref="moveableTarget"
      :class="css({ display: 'inline-flex' })"
    >
      <Popover.RootProvider :value="popover">
        <Popover.Anchor id="messenger-panel-anchor" as-child>
          <NvCard
            variant="transparent"
            ref="messenger"
            class="messenger"
            :class="
              css({
                borderRadius: 'md',
                display: 'grid',
                padding: '4',
                gap: '4',
                gridTemplateRows: 'none',
                width: '768px',
              })
            "
            data-v-step="messenger-window"
          >
            <!-- Top -->
            <NvGroup :spacing="4">
              <NvMessengerLinksBar />
              <NvGroup :spacing="4" :class="css({ flex: '1 1 0% !important' })">
                <div
                  class="moveable-handle"
                  @pointerdown.capture="onHandlePointerDown"
                  :class="
                    css({ cursor: 'all-scroll', flex: '1 1 0% !important' })
                  "
                >
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
          </NvCard>
        </Popover.Anchor>
        <Teleport v-if="routerOverlay" :to="routerOverlay">
          <Popover.Positioner>
            <Transition
              name="messenger-panel"
              :duration="{ enter: 300, leave: 250 }"
              @after-leave="resetRoute"
            >
              <Popover.Content
                v-show="popover.open"
                :hidden="false"
                aria-label="Messenger panel"
              >
                <RouterView @close="closePanel" />
              </Popover.Content>
            </Transition>
          </Popover.Positioner>
        </Teleport>
      </Popover.RootProvider>
    </NvHitbox>
    <Moveable
      ref="moveable"
      :bounds="{
        left: 12,
        right: viewport.width - 12,
        top: 12,
        bottom: viewport.height - 12,
      }"
      :dragTarget="document.querySelector('.moveable-handle')"
      :draggable="true"
      :elementGuidelines="[document.querySelector('body')]"
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
      :className="css({ opacity: 0 })"
      target="#moveable"
      @drag="onDrag"
    />
  </div>
</template>
<script lang="ts" setup>
import { css } from '@/styled-system/css'
import {
  ComponentPublicInstance,
  computed,
  onMounted,
  onBeforeUnmount,
  provide,
  ref,
  type Ref,
  watch,
  inject,
} from 'vue'
import Moveable from 'vue3-moveable'
import { NvCard, NvGroup, tokens } from '@packages/ui'
import {
  type RouteLocationRaw,
  isNavigationFailure,
  NavigationFailureType,
  useRouter,
} from 'vue-router'
import NvHitbox from '@/modules/vue-hitboxes/NvHitbox.vue'
import { useMessengerStore } from '@/teams/messenger/store'
import NvMessengerInputBar from '@/teams/messenger/components/NvMessengerInputBar.vue'
import NvMessengerAudioBar from '@/teams/messenger/components/NvMessengerAudioBar.vue'
import NvMessengerMessageBar from '@/teams/messenger/components/NvMessengerMessageBar.vue'
import NvMessengerLinksBar from '@/teams/messenger/components/NvMessengerLinksBar.vue'
import NvMessengerHandleBar from '@/teams/messenger/components/NvMessengerHandleBar.vue'
import NvMessengerNavigationBar from '@/teams/messenger/components/NvMessengerNavigationBar.vue'
import debounce from 'lodash/debounce'
import { useElementSize, useEventListener, useWindowSize } from '@vueuse/core'
import throttle from 'lodash/throttle'
import { isGameOverlay } from '@/consts.ts'
import { Popover, usePopover } from '@ark-ui/vue'

const routerOverlay = inject<Ref<HTMLElement | undefined>>('router-overlay')
// import gsap from 'gsap'
// const messengerWindowStore = useMessengerWindowStore()
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
const moveableTarget = ref<ComponentPublicInstance>()

const popover = usePopover({
  ids: { anchor: 'messenger-panel-anchor' },
  // Route actions own dismissal; opening starts keyboard navigation at Close.
  initialFocusEl: () =>
    routerOverlay?.value?.querySelector<HTMLElement>(
      '[data-messenger-panel-close]',
    ) || null,
  closeOnEscape: false,
  closeOnInteractOutside: false,
  positioning: {
    placement: 'top-start',
    gutter: tokens.spacing['4'],
  },
})
const { document } = window
const router = useRouter()
let navigationId = 0
let pendingNavigation = 0
let hasLeft = true
let disposed = false
const closePanel = () => {
  navigationId++
  pendingNavigation = 0
  popover.value.setOpen(false)
}
const resetRoute = () => {
  hasLeft = true
  // Reset only after the panel has fully left, so retained route drafts survive
  // a cancelled close and the next fully closed visit gets a fresh page.
  if (!disposed && !popover.value.open && !pendingNavigation) {
    return router.push({ path: '/' })
  }
}
const navigateTo = async (location: RouteLocationRaw) => {
  if (
    popover.value.open &&
    typeof location === 'object' &&
    'name' in location &&
    router.currentRoute.value.name === location.name
  ) {
    closePanel()
    return
  }
  const requestId = ++navigationId
  pendingNavigation = requestId
  let failure
  try {
    failure = await router.push(location)
  } catch (error) {
    if (pendingNavigation === requestId) pendingNavigation = 0
    if (
      !disposed &&
      requestId === navigationId &&
      hasLeft &&
      !popover.value.open
    ) {
      try {
        await resetRoute()
      } catch {
        // Cleanup must not replace the original navigation error.
      }
    }
    throw error
  } finally {
    if (pendingNavigation === requestId) pendingNavigation = 0
  }
  if (disposed || requestId !== navigationId) return
  if (
    !failure ||
    isNavigationFailure(failure, NavigationFailureType.duplicated)
  ) {
    hasLeft = false
    popover.value.setOpen(true)
  } else if (hasLeft) {
    return resetRoute()
  }
}

const isViewShown = computed(() => popover.value.open)
provide('messenger', {
  navigateTo,
  isViewShown,
})

const { width: windowWidth, height: windowHeight } = useWindowSize()
// TODO: refactor to use only app dimensions
// Note: Game overlay can only be resized using body for now
const { width: appWidth, height: appHeight } = useElementSize(
  ref(document.getElementById('app')),
)
const viewport = computed(() => ({
  width: isGameOverlay
    ? appWidth.value
    : Math.max(
        windowWidth.value,
        document.documentElement.clientWidth || 0,
        window.innerWidth || 0,
      ),
  height: isGameOverlay
    ? appHeight.value
    : Math.max(
        windowHeight.value,
        document.documentElement.clientHeight || 0,
        window.innerHeight || 0,
      ),
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

function onHandlePointerDown(event: PointerEvent) {
  if (event.button !== 0 || event.isPrimary === false) return
  const target = event.target
  if (
    target instanceof Element &&
    target.closest(
      'button, a[href], input, select, textarea, [tabindex], [contenteditable]',
    )
  )
    return
  // Moveable prevents the native mouse default and only blurs text fields.
  // Release buttons too when pressing the drag surface, before drag handling.
  const active = document.activeElement
  if (active instanceof HTMLElement) active.blur()
}

const onDrag = (event: any) => {
  const { target, transform } = event
  target.style.transform = transform
  if (!isGameOverlay) {
    savePosition(event)
  }
  if (popover.value.open) popover.value.reposition()
}
// watch(() => messengerWindowStore.isShown, (isShown) => {
//   console.log(gsap.getProperty(messenger.value, 'y'))
//   if (isShown) {
//     gsap.to(messenger.value, {
//       opacity: 1,
//       duration: 0.2,
//       transition: 'easeOutExpo',
//     })
//   } else {
//     gsap.set(messenger.value, {
//       opacity: 0,
//     })
//   }
// })
const previousWindowSize = ref<{ width: number; height: number }>({
  width: viewport.value.width,
  height: viewport.value.height,
})

function parseTransform(transform: string | null) {
  if (!transform) {
    return { x: 0, y: 0 }
  }
  const translateRegex =
    /translate\((-?\d+(\.\d+)?)(px)?,\s*(-?\d+(\.\d+)?)(px)?\)/
  const match = translateRegex.exec(transform)
  if (match) {
    const x = parseFloat(match[1])
    const y = parseFloat(match[4])
    return { x, y }
  }
  return { x: 0, y: 0 }
}

const { width: moveableTargetWidth, height: moveableTargetHeight } =
  useElementSize(moveableTarget)

let convertScreenPositionTimeout = null

function convertScreenPosition() {
  const { width: previousWindowWidth, height: previousWindowHeight } =
    previousWindowSize.value
  const currentWindowWidth = viewport.value.width
  const currentWindowHeight = viewport.value.height
  if (
    previousWindowWidth !== currentWindowWidth ||
    previousWindowHeight !== currentWindowHeight
  ) {
    const { x: currentXValue, y: currentYValue } = parseTransform(
      props.transform,
    )
    const currentCenteredXValue = currentXValue + moveableTargetWidth.value / 2
    const currentCenteredYValue = currentYValue + moveableTargetHeight.value / 2
    const previousCenteredXPercentage =
      currentCenteredXValue / previousWindowWidth
    const previousCenteredYPercentage =
      currentCenteredYValue / previousWindowHeight
    const newXValue =
      currentWindowWidth * previousCenteredXPercentage -
      moveableTargetWidth.value / 2
    const newYValue =
      currentWindowHeight * previousCenteredYPercentage -
      moveableTargetHeight.value / 2
    if (convertScreenPositionTimeout) clearTimeout(convertScreenPositionTimeout)
    convertScreenPositionTimeout = setTimeout(() => {
      if (moveable.value) {
        moveable.value.request(
          'draggable',
          {
            x: newXValue,
            y: newYValue,
          },
          true,
        )
      }

      previousWindowSize.value = {
        width: currentWindowWidth,
        height: currentWindowHeight,
      }
      convertScreenPositionTimeout = null
    }, 1000)
  }
}

let setGameOverlayMessengerPositionTimeout = null

function setGameOverlayMessengerPosition() {
  const currentWindowWidth = viewport.value.width
  const currentWindowHeight = viewport.value.height
  const newXValue = currentWindowWidth / 2 - moveableTargetWidth.value / 2
  const newYValue = currentWindowHeight - moveableTargetHeight.value
  if (setGameOverlayMessengerPositionTimeout)
    clearTimeout(setGameOverlayMessengerPositionTimeout)
  setGameOverlayMessengerPositionTimeout = setTimeout(() => {
    if (moveable.value) {
      moveable.value.request(
        'draggable',
        {
          x: newXValue,
          y: newYValue,
        },
        true,
      )
    }
    setGameOverlayMessengerPositionTimeout = null
  }, 1000)
}

useEventListener(
  'resize',
  throttle(() => {
    convertScreenPosition()
  }, 500),
)

watch([appWidth, appHeight], () => {
  if (isGameOverlay) {
    setGameOverlayMessengerPosition()
  }
})

let initialPositionTimeout: ReturnType<typeof setTimeout> | undefined
let restoreFocusTimeout: ReturnType<typeof setTimeout> | undefined

onBeforeUnmount(() => {
  disposed = true
  navigationId++
  savePosition.cancel()
  if (convertScreenPositionTimeout) clearTimeout(convertScreenPositionTimeout)
  if (setGameOverlayMessengerPositionTimeout)
    clearTimeout(setGameOverlayMessengerPositionTimeout)
  clearTimeout(initialPositionTimeout)
  clearTimeout(restoreFocusTimeout)
})

onMounted(() => {
  // gsap.set(messenger.value, {
  //   opacity: 0,
  // })
  const moveableTargetEl = moveableTarget.value?.$el as HTMLDivElement | null
  if (moveableTargetEl) {
    if (props.width) moveableTargetEl.style.width = `${props.width}px`
    if (props.minWidth) moveableTargetEl.style.minWidth = `${props.minWidth}px`
    if (props.maxWidth) moveableTargetEl.style.maxWidth = `${props.maxWidth}px`
    if (props.height) moveableTargetEl.style.height = `${props.height}px`
    if (props.minHeight)
      moveableTargetEl.style.minHeight = `${props.minHeight}px`
    if (props.maxHeight)
      moveableTargetEl.style.maxHeight = `${props.maxHeight}px`
    if (props.transform) moveableTargetEl.style.transform = props.transform
  }
  moveable.value.updateTarget()

  initialPositionTimeout = setTimeout(() => {
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
    restoreFocusTimeout = setTimeout(() => {
      moveable.value.request('draggable', { deltaX: 0, deltaY: 1 }, true)
    }, 1000)
  }, 1000)
})
</script>
<style scoped>
.messenger-panel-enter-active {
  transition: opacity 300ms ease;
}
.messenger-panel-leave-active {
  transition: opacity 250ms ease;
}
.messenger-panel-enter-from,
.messenger-panel-leave-to {
  opacity: 0;
}
</style>
