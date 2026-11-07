<template>
  <StPopover v-bind="props">
    <Popover.Root
      v-model:open="open"
      :ids="{ trigger: triggerId }"
      :positioning="{
        placement: props.placement,
        flip: true,
        overflowPadding: tokens.spacing['3'],
        offset: { mainAxis: tokens.spacing['4'] },
      }"
      portalled
      @interact-outside="onInteractOutside"
    >
      <Popover.Trigger ref="trigger" :id="triggerId" as-child>
        <slot name="reference" />
      </Popover.Trigger>
      <Teleport :to="portalTarget" defer>
        <div
          v-if="open"
          data-overlay-shield="popover"
          :class="popoverShield()"
          @click.stop.prevent="open = false"
          @mouseup.stop.prevent
          @mousedown.stop.prevent
          @pointerdown.stop.prevent
          @pointerup.stop.prevent
          @wheel="onOverlayShieldWheel"
        />
        <StPopoverPositioner>
          <StPopoverContent :hidden="false">
            <Transition>
              <Card v-if="open" :size="props.size === 'lg' ? 'md' : props.size">
                <slot />
              </Card>
            </Transition>
          </StPopoverContent>
        </StPopoverPositioner>
      </Teleport>
    </Popover.Root>
  </StPopover>
</template>
<script lang="ts" setup>
import { computed, inject, ref, useId, watchPostEffect } from 'vue'
import {
  StPopover,
  StPopoverContent,
  StPopoverPositioner,
  popoverShield,
} from './popover.panda'
import { props as propsDefinition } from './popover.shared'
import { tokens } from '@/styles/tokens'
import { Popover } from '@ark-ui/vue'
import Card from '@/components/display/Card/NvCard.vue'
import { getElement } from '@/utils/vue'
import { PORTAL_TARGET } from '@/consts'
import { onOverlayShieldWheel } from '@/utils/overlay-scroll'

const open = ref(false)
const trigger = ref()
const triggerId = ref(`nv-popover-${useId()}-trigger`)
watchPostEffect(() => {
  // Positioning and focus lookup must use the as-child owner's retained ID.
  const root = getElement(trigger.value)
  const element =
    root?.querySelector<HTMLElement>(
      '[data-scope="popover"][data-part="trigger"]',
    ) || root
  if (element?.id) triggerId.value = element.id
})
const props = defineProps(propsDefinition)
const injectedPortalTarget = inject(PORTAL_TARGET)
const portalTarget = computed(() => getElement(injectedPortalTarget) || 'body')
function onInteractOutside(event: CustomEvent) {
  // Dismiss on click, not pointerdown: the full pointer sequence must hit the shield.
  const target = event.detail?.originalEvent?.target as HTMLElement | undefined
  if (target?.closest('[data-overlay-shield="popover"]')) event.preventDefault()
}
</script>
