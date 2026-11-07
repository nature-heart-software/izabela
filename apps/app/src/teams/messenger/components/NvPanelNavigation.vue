<template>
  <Popover.RootProvider :value="popover">
    <Popover.Anchor as-child>
      <span :class="css({ display: 'inline-flex' })">
        <NvTooltip>
          <NvText>Close</NvText>
          <template #reference>
            <NvButton
              :id="closeId"
              data-messenger-panel-close
              aria-label="Close"
              aria-haspopup="dialog"
              :aria-expanded="popover.open"
              icon-name="times"
              size="xs"
              type="plain"
              @click="$emit('close')"
              @keydown.tab="onCloseTab"
              @focus="popover.setOpen(false)"
            />
          </template>
        </NvTooltip>
      </span>
    </Popover.Anchor>
    <Popover.Positioner
      v-if="popover.open"
      :class="css({ zIndex: '9999 !important' })"
    >
      <Popover.Content as-child>
        <NvCard
          data-panel-navigation
          size="sm"
          :class="css({ minWidth: '220px' })"
        >
          <NvStack :spacing="4">
            <Popover.Title as-child>
              <NvText type="subtitle">Navigate to</NvText>
            </Popover.Title>
            <NvButton size="lg" @click="focusArea(props.sidebar, true)">
              Navigation
            </NvButton>
            <NvButton size="lg" @click="focusArea(props.content)">
              Page content
            </NvButton>
          </NvStack>
        </NvCard>
      </Popover.Content>
    </Popover.Positioner>
  </Popover.RootProvider>
</template>
<script lang="ts" setup>
import { onMounted, useId } from 'vue'
import { Popover, usePopover } from '@ark-ui/vue'
import { NvButton, NvCard, NvStack, NvText, NvTooltip } from '@packages/ui'
import { css } from '@/styled-system/css'

const props = defineProps<{
  sidebar?: HTMLElement
  content?: HTMLElement
}>()
defineEmits<{ close: [] }>()
const closeId = `panel-close-${useId()}`
const closeButton = () => document.getElementById(closeId)
const popover = usePopover({
  // Close is an anchor, not a popover trigger: selecting an area must keep
  // focus there instead of running Ark's automatic trigger restoration.
  portalled: false,
  onEscapeKeyDown: () => closeButton()?.focus({ preventScroll: true }),
  positioning: { placement: 'bottom-end', gutter: 8 },
})

// A new panel owns initial focus, including switching between Settings and
// Messages while the outer messenger popup is already open.
onMounted(() => closeButton()?.focus({ preventScroll: true }))

function onCloseTab(event: KeyboardEvent) {
  if (event.shiftKey || event.altKey || event.ctrlKey || event.metaKey) return
  event.preventDefault()
  popover.value.setOpen(true)
}

function focusArea(area?: HTMLElement, preferCurrent = false) {
  if (!area) return
  const candidates = [
    ...area.querySelectorAll<HTMLElement>(
      'a[href], button, input, select, textarea, [tabindex], [contenteditable="true"]',
    ),
  ].filter(
    (element) =>
      element.tabIndex >= 0 &&
      !element.matches(':disabled') &&
      !element.closest('[inert], [hidden], [aria-hidden="true"]') &&
      element.getClientRects().length > 0 &&
      getComputedStyle(element).visibility !== 'hidden',
  )
  const target =
    (preferCurrent &&
      candidates.find(
        (element) => element.getAttribute('aria-current') === 'page',
      )) ||
    candidates[0] ||
    area
  target.focus()
  popover.value.setOpen(false)
}
</script>
