<template>
  <StTooltip ref="tooltip" v-bind="props">
    <Tooltip.RootProvider :value="tooltipApi">
      <Tooltip.Trigger ref="trigger" :id="triggerId" as-child>
        <slot name="reference" />
      </Tooltip.Trigger>
      <Teleport :to="portalTarget" defer>
        <StTooltipPositioner
          v-if="open && !focused"
          :style="{ '--nv-tooltip-enter-duration': `${enterDuration}ms` }"
        >
          <StTooltipContent><slot /></StTooltipContent>
        </StTooltipPositioner>
      </Teleport>
    </Tooltip.RootProvider>
  </StTooltip>
</template>
<script lang="ts" setup>
import { computed, inject, reactive, ref, useId, watchPostEffect } from 'vue'
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
  useFocusWithin,
  useMutationObserver,
} from '@vueuse/core'
import { getElement } from '@/utils/vue'
import { PORTAL_TARGET } from '@/consts'

const props = defineProps(propsDefinition)
const trigger = ref()
const triggerId = ref(`nv-tooltip-${useId()}-trigger`)
function syncTrigger() {
  // Zag measures the trigger by ID even when Ark composes a consumer element.
  const element = getElement(trigger.value)
  const selector = '[data-scope="tooltip"][data-part="trigger"]'
  // Composite references can own an input and a separate full-control trigger.
  // Resolve the marked primitive owner, not an incidental component root.
  const target = element?.matches(selector)
    ? element
    : element?.querySelector<HTMLElement>(selector) || element
  if (target?.id) triggerId.value = target.id
}
watchPostEffect(syncTrigger)
const tooltip = ref<MaybeElement>()
// Async voice components can replace a comment with their control without
// changing Tooltip.Trigger's component ref. Observe that scoped DOM boundary.
useMutationObserver(tooltip, syncTrigger, { childList: true, subtree: true })
const { focused } = useFocusWithin(tooltip)
const injectedPortalTarget = inject(PORTAL_TARGET)
const portalTarget = computed(
  () => getElement(injectedPortalTarget) || document.body,
)
const openDelay = computed(() =>
  Array.isArray(props.tippyOptions.delay)
    ? (props.tippyOptions.delay[0] ?? 250)
    : (props.tippyOptions.delay ?? 250),
)
const closeDelay = computed(() =>
  Array.isArray(props.tippyOptions.delay)
    ? (props.tippyOptions.delay[1] ?? 0)
    : (props.tippyOptions.delay ?? 0),
)
const enterDuration = computed(() => {
  if (props.tippyOptions.animation === false) return 0
  const duration = props.tippyOptions.duration
  return Array.isArray(duration) ? (duration[0] ?? 300) : (duration ?? 300)
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
    disabled: focused,
    openDelay,
    closeDelay,
    positioning,
    interactive: computed(() => props.tippyOptions.interactive ?? false),
  }),
)
const open = computed(() => tooltipApi.value.open)
function deactivate(event: Event) {
  // The click-through Electron window can miss pointerleave when it loses focus.
  // Reset hover as well as visibility so the next pointer entry can reopen normally.
  tooltipApi.value.getTriggerProps().onPointerleave?.(event as PointerEvent)
  tooltipApi.value.setOpen(false)
}
useEventListener(window, 'blur', deactivate)
useEventListener(document, 'visibilitychange', (event) => {
  if (document.hidden) deactivate(event)
})
</script>
