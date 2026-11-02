<template>
  <StTooltip ref="tooltip" v-bind="props">
    <Tooltip.Root
      v-model:open="open"
      :ids="{ trigger: triggerId }"
      :disabled="focused"
      :open-delay="openDelay"
      :close-delay="closeDelay"
      :positioning="positioning"
      :interactive="props.tippyOptions.interactive ?? false"
    >
      <Tooltip.Trigger ref="trigger" :id="triggerId" as-child>
        <slot name="reference" />
      </Tooltip.Trigger>
      <Teleport :to="portalTarget" defer>
        <StTooltipPositioner v-if="open && !focused">
          <StTooltipContent><slot /></StTooltipContent>
        </StTooltipPositioner>
      </Teleport>
    </Tooltip.Root>
  </StTooltip>
</template>
<script lang="ts" setup>
import { computed, inject, ref, useId, watch, watchPostEffect } from 'vue'
import { Tooltip, type TooltipRootProps } from '@ark-ui/vue'
import {
  StTooltip,
  StTooltipContent,
  StTooltipPositioner,
} from './tooltip.panda'
import { props as propsDefinition } from './tooltip.shared'
import { tokens } from '@/styles/tokens'
import { type MaybeElement, useFocusWithin } from '@vueuse/core'
import { getElement } from '@/utils/vue'
import { PORTAL_TARGET } from '@/consts'

const props = defineProps(propsDefinition)
const open = ref(false)
const trigger = ref()
const triggerId = ref(`nv-tooltip-${useId()}-trigger`)
watchPostEffect(() => {
  // Zag measures the trigger by ID even when Ark composes a consumer element.
  const element = getElement(trigger.value)
  if (element?.id) triggerId.value = element.id
})
const tooltip = ref<MaybeElement>()
const { focused } = useFocusWithin(tooltip)
watch(focused, (value) => {
  if (value) open.value = false
})
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
</script>
