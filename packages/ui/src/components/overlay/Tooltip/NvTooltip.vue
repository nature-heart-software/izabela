<template>
  <StTooltip
    ref="tooltip"
    v-bind="props"
    :class="$attrs.class"
    :style="$attrs.style"
  >
    <Tooltip.RootProvider :value="tooltipApi">
      <ReferenceTrigger
        ref="trigger"
        v-bind="referenceAttrs()"
        :id="referenceId()"
      >
        <slot name="reference" />
      </ReferenceTrigger>
      <Teleport :to="portalTarget" defer>
        <StTooltipPositioner
          v-if="open && !expanded"
          :style="{
            '--nv-tooltip-enter-duration': `${enterDuration}ms`,
            pointerEvents: props.tippyOptions.interactive ? undefined : 'none',
          }"
        >
          <StTooltipContent><slot /></StTooltipContent>
        </StTooltipPositioner>
      </Teleport>
    </Tooltip.RootProvider>
  </StTooltip>
</template>
<script lang="ts" setup>
import {
  cloneVNode,
  Comment,
  computed,
  defineComponent,
  Fragment,
  inject,
  mergeProps,
  nextTick,
  onBeforeUnmount,
  reactive,
  ref,
  Text,
  useAttrs,
  useId,
  watch,
  watchPostEffect,
  type VNode,
} from 'vue'
import { Tooltip, useTooltip, type TooltipRootProps } from '@ark-ui/vue'
import {
  StTooltip,
  StTooltipContent,
  StTooltipPositioner,
} from './tooltip.panda'
import { props as propsDefinition } from './tooltip.shared'
import { tokens } from '@/styles/tokens'
import {
  type MaybeElement,
  useEventListener,
  useMutationObserver,
} from '@vueuse/core'
import { getElement } from '@/utils/vue'
import { PORTAL_TARGET } from '@/consts'

const props = defineProps(propsDefinition)
defineOptions({ inheritAttrs: false })
const attrs = useAttrs()
const referenceAttrs = () =>
  Object.fromEntries(
    Object.entries(attrs).filter(([key]) => key !== 'class' && key !== 'style'),
  )
const trigger = ref()
const expanded = ref(false)
let focusRequest = 0
let focusFrame: number | undefined
const triggerId = ref(`nv-tooltip-${useId()}-trigger`)
const referenceId = () =>
  typeof attrs.id === 'string' ? attrs.id : triggerId.value
const ReferenceTrigger = defineComponent({
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    function flatten(nodes: VNode[]): VNode[] {
      return nodes.flatMap((node) =>
        node.type === Fragment ? flatten(node.children as VNode[]) : [node],
      )
    }
    return () => {
      const [node, ...rest] = flatten(slots.default?.() || []).filter(
        (node) =>
          node.type !== Comment &&
          (node.type !== Text || String(node.children).trim()),
      )
      if (!node) return null
      // Vue can supply an array of listeners when overlay triggers are nested.
      // Ark 3's as-child merger only composes functions and drops those arrays
      // when the native control also has a listener (e.g. Ctrl-click to toggle).
      const triggerProps = tooltipApi.value.getTriggerProps()
      const merged = mergeProps(
        node.props || {},
        {
          ...triggerProps,
          onFocusin: onReferenceFocus,
          onFocusout: onReferenceBlur,
          onClick: (event: MouseEvent) => {
            cancelFocusActivation()
            triggerProps.onClick?.(event)
          },
          onPointermove: (event: PointerEvent) => {
            if (!expanded.value) triggerProps.onPointermove?.(event)
          },
        },
        attrs,
      )
      merged.id = node.props?.id || attrs.id || triggerId.value
      const cloned = cloneVNode(node)
      cloned.props = merged
      return rest.length ? [cloned, ...rest] : cloned
    }
  },
})
// A tooltip is transparent when used as another overlay's reference: the
// native control owns its trigger attributes, focus and restoration target.
function syncTrigger() {
  // Zag measures the trigger by ID even when Ark composes a consumer element.
  const element = getElement(trigger.value)
  const selector = '[data-part="trigger"]'
  // Composite references can own an input and a separate full-control trigger.
  // Resolve the marked primitive owner, not an incidental component root.
  const target = element?.matches(selector)
    ? element
    : element?.querySelector<HTMLElement>(selector) || element
  if (target?.id) triggerId.value = target.id
  expanded.value = !!(
    target?.matches('[aria-expanded="true"]') ||
    target?.querySelector('[aria-expanded="true"]')
  )
}
watchPostEffect(syncTrigger)
const tooltip = ref<MaybeElement>()
// Async voice components can replace a comment with their control without
// changing the reference's component ref. Observe that scoped DOM boundary.
useMutationObserver(tooltip, syncTrigger, {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: ['aria-expanded'],
})
const injectedPortalTarget = inject(PORTAL_TARGET)
const portalTarget = computed(
  () => getElement(injectedPortalTarget) || document.body,
)
const openDelay = computed(() =>
  Array.isArray(props.tippyOptions.delay)
    ? props.tippyOptions.delay[0] ?? 250
    : props.tippyOptions.delay ?? 250,
)
const closeDelay = computed(() =>
  Array.isArray(props.tippyOptions.delay)
    ? props.tippyOptions.delay[1] ?? 0
    : props.tippyOptions.delay ?? 0,
)
const enterDuration = computed(() => {
  if (props.tippyOptions.animation === false) return 0
  const duration = props.tippyOptions.duration
  return Array.isArray(duration) ? duration[0] ?? 300 : duration ?? 300
})
const positioning = computed<TooltipRootProps['positioning']>(() => ({
  placement:
    !props.tippyOptions.placement ||
    props.tippyOptions.placement === 'auto' ||
    props.tippyOptions.placement === 'auto-start' ||
    props.tippyOptions.placement === 'auto-end'
      ? 'top'
      : props.tippyOptions.placement,
  offset: {
    mainAxis: Array.isArray(props.tippyOptions.offset)
      ? props.tippyOptions.offset[1]
      : tokens.spacing['4'],
    crossAxis: Array.isArray(props.tippyOptions.offset)
      ? props.tippyOptions.offset[0]
      : 0,
  },
}))
// Let Ark cancel its opening delay when the pointer leaves before becoming visible.
// Mirroring a still-false controlled `open` value loses that cancellation transition.
const tooltipApi = useTooltip(
  reactive({
    ids: computed(() => ({ trigger: triggerId.value })),
    openDelay,
    closeDelay,
    positioning,
    interactive: computed(() => props.tippyOptions.interactive ?? false),
  }),
)
const open = computed(() => tooltipApi.value.open)
function cancelFocusActivation() {
  focusRequest++
  if (focusFrame !== undefined) cancelAnimationFrame(focusFrame)
  focusFrame = undefined
}
onBeforeUnmount(cancelFocusActivation)
async function onReferenceFocus(event: FocusEvent) {
  cancelFocusActivation()
  const request = focusRequest
  // Focus can arrive during mounting or while its handler closes a popover.
  // Resolve the retained owner and expanded state after that render completes.
  await nextTick()
  if (request !== focusRequest || event.defaultPrevented) return
  // Native Escape handlers can restore focus before that same key finishes
  // propagating. Open on the next frame so it cannot dismiss the new tooltip.
  focusFrame = requestAnimationFrame(() => {
    focusFrame = undefined
    if (request !== focusRequest) return
    syncTrigger()
    const reference = getElement(tooltip.value)
    if (!expanded.value && reference?.contains(document.activeElement)) {
      tooltipApi.value.setOpen(true)
    }
  })
}
function onReferenceBlur(event: FocusEvent) {
  const next = event.relatedTarget
  const reference = getElement(tooltip.value)
  const contentId = tooltipApi.value.getContentProps().id
  const content = contentId ? document.getElementById(contentId) : null
  if (
    next instanceof Node &&
    (reference?.contains(next) ||
      (props.tippyOptions.interactive && content?.contains(next)))
  ) {
    cancelFocusActivation()
    return
  }
  deactivate(event)
}
function deactivate(event: Event) {
  cancelFocusActivation()
  // The click-through Electron window can miss pointerleave when it loses focus.
  // Reset hover as well as visibility so the next pointer entry can reopen normally.
  tooltipApi.value.getTriggerProps().onPointerleave?.(event as PointerEvent)
  tooltipApi.value.setOpen(false)
}
function onOutsidePointerDown(event: PointerEvent) {
  const path = event.composedPath()
  const reference = getElement(tooltip.value)
  const contentId = tooltipApi.value.getContentProps().id
  const content = contentId ? document.getElementById(contentId) : null
  if (
    (reference && path.includes(reference)) ||
    (content && path.includes(content))
  )
    return
  // An outside click can leave the trigger focused. Dismiss independently of
  // blur, without consuming the click or interfering with interactive content.
  deactivate(event)
}
useEventListener(document, 'pointerdown', onOutsidePointerDown, {
  capture: true,
})
watch(expanded, (expanded) => {
  if (expanded) deactivate(new Event('pointerleave'))
})
useEventListener(window, 'blur', deactivate)
useEventListener(document, 'visibilitychange', (event) => {
  if (document.hidden) deactivate(event)
})
</script>
