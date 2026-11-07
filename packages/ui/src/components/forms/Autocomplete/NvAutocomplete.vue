<template>
  <div>
    <Popover.Root
      :autoFocus="false"
      :open="props.visible"
      :portalled="false"
      :positioning="{
        placement: props.placement,
        flip: true,
        overflowPadding: tokens.spacing['3'],
        offset: {
          mainAxis: tokens.spacing['4'],
        },
      }"
      @open-change="emit('openChange', $event)"
      @escape-key-down="emit('escapeKeyDown', $event)"
      @focus-outside="onOutside('focusOutside', $event)"
      @interact-outside="onOutside('interactOutside', $event)"
      @pointer-down-outside="onOutside('pointerDownOutside', $event)"
    >
      <Popover.Anchor ref="reference" :class="referenceStyle()" @blur.prevent>
        <slot name="reference" />
      </Popover.Anchor>
      <Teleport :to="portalTarget" defer>
        <div
          ref="shieldElement"
          v-show="props.visible"
          :class="shield()"
          :style="{
            '--nv-shield-x': `${shieldOffset.x}px`,
            '--nv-shield-y': `${shieldOffset.y}px`,
          }"
          data-nv-overlay-shield
          @click.stop.prevent="onShieldClick"
          @mouseup.stop.prevent
          @mousedown.stop.prevent
          @pointerdown.stop.prevent
          @pointerup.stop.prevent
          @wheel="onOverlayShieldWheel"
        />
        <Popover.Positioner ref="positioner" :class="positionerStyle()">
          <Popover.Content :hidden="false" asChild>
            <div
              ref="contentHost"
              @click.stop.prevent
              @mouseup.stop.prevent
              @mousedown.stop.prevent
            >
              <Transition>
                <StAutocomplete
                  v-if="props.visible"
                  class="autocomplete"
                  v-bind="props"
                  :style="{
                    '--nv-autocomplete-min-width': `${
                      autocompleteWidth / 16
                    }rem`,
                  }"
                >
                  <template v-if="props.options.length === 0">
                    <slot name="fallback" />
                  </template>
                  <slot name="list">
                    <NvVirtualListContainer
                      v-show="props.options.length > 0"
                      class="autocomplete__list"
                    >
                      <NvVirtualList
                        ref="list"
                        :count="props.options.length"
                        :estimateSize="() => props.estimateSize"
                        :options="{
                          getItemKey: itemKey,
                        }"
                        @visible="onVisible"
                        @wheel="selection = null"
                      >
                        <template #default="scope">
                          <slot
                            name="default"
                            v-bind="{
                              ...scope,
                              active: selection === scope.index,
                              item: props.options[scope.index],
                            }"
                          />
                        </template>
                      </NvVirtualList>
                    </NvVirtualListContainer>
                  </slot>
                </StAutocomplete>
              </Transition>
            </div>
          </Popover.Content>
        </Popover.Positioner>
      </Teleport>
    </Popover.Root>
  </div>
</template>
<script lang="ts" setup>
import { Popover } from '@ark-ui/vue'
import { computed, inject, provide, ref, watch } from 'vue'
import {
  StAutocomplete,
  shield,
  positionerStyle,
  reference as referenceStyle,
} from './autocomplete.panda'
import { defaultWidth, props as propsDefinition } from './autocomplete.shared'
import { tokens } from '@/styles/tokens'
import { onKeyStroke, useElementSize } from '@vueuse/core'
import NvVirtualList from '@/components/miscellaneous/VirtualList/NvVirtualList.vue'
import NvVirtualListContainer from '@/components/miscellaneous/VirtualList/NvVirtualListContainer.vue'
import get from 'lodash/get'
import { Virtualizer } from '@tanstack/virtual-core'
import { getElement } from '@/utils/vue'
import { PORTAL_TARGET } from '@/consts'
import { onOverlayShieldWheel } from '@/utils/overlay-scroll'
import { useViewportShield } from '@/utils/overlay-shield'

// The list is teleported below, but its keyboard focus stays on the input.
// Ark's portalled popover proxy captures Tab before completion can handle it.
const props = defineProps(propsDefinition)
defineSlots<{
  reference(): unknown
  fallback(): unknown
  list(): unknown
  default(props: { active: boolean; item: any; index: number }): unknown
}>()
function itemKey(index: number) {
  const item = props.options[index]
  const value = props.valueKey ? get(item, props.valueKey) : item
  return typeof value === 'string' || typeof value === 'number' ? value : index
}
const list = ref<
  undefined | { scrollToIndex: Virtualizer<Element, Element>['scrollToIndex'] }
>()
const reference = ref()
// The maintained anchor owns a stable primitive ID independently of consumer
// reference IDs, without injecting button type/ARIA semantics into text inputs.
const autocomplete = ref()
const selection = ref<number | null | undefined>(null)

const { width } = useElementSize(reference)
const loading = ref(true)
const positioner = ref()
const shieldElement = ref<HTMLElement>()
const shieldOffset = ref({ x: 0, y: 0 })
const contentHost = ref<HTMLElement>()
const emit = defineEmits([
  'select',
  'positionerChange',
  'openChange',
  'escapeKeyDown',
  'focusOutside',
  'interactOutside',
  'pointerDownOutside',
])

watch(positioner, (positioner) => {
  emit('positionerChange', positioner)
})

watch(
  () => props.visible,
  (visible) => {
    if (!visible) loading.value = true
    selection.value = null
  },
)

watch(
  () => props.options,
  () => {
    selection.value = props.options.length > 0 ? 0 : null
  },
)

watch(selection, (selection) => {
  if (isValidIndex(selection)) {
    list.value?.scrollToIndex(selection)
  }
})

const autocompleteWidth = computed(() => {
  if (props.width) {
    return props.width
  }
  if (width.value < defaultWidth) {
    return defaultWidth
  }
  return width.value
})

function isValidIndex(index: unknown): index is number {
  return (
    typeof index === 'number' &&
    Number.isInteger(index) &&
    index >= 0 &&
    index < props.options.length
  )
}

onKeyStroke('ArrowDown', (e) => {
  if (!props.keyboardNavigation) return
  if (!props.visible || props.options.length === 0) return
  e.preventDefault()
  if (!isValidIndex(selection.value)) {
    selection.value = isValidIndex(props.autoScrollIndex)
      ? props.autoScrollIndex
      : 0
    return
  }
  if (selection.value === props.options.length - 1) {
    selection.value = 0
  } else {
    selection.value += 1
  }
})

onKeyStroke('ArrowUp', (e) => {
  if (!props.keyboardNavigation) return
  if (!props.visible || props.options.length === 0) return
  e.preventDefault()
  if (!isValidIndex(selection.value)) {
    selection.value = isValidIndex(props.autoScrollIndex)
      ? props.autoScrollIndex
      : 0
    return
  }
  if (selection.value === 0) {
    selection.value = props.options.length - 1
  } else {
    selection.value -= 1
  }
})

onKeyStroke('Enter', (e) => {
  if (!props.keyboardNavigation) return
  if (
    !props.visible ||
    !isValidIndex(selection.value) ||
    props.options[selection.value] === undefined
  )
    return
  e.preventDefault()
  emit('select', props.options[selection.value])
})

onKeyStroke('Tab', (e) => {
  if (e.shiftKey) return
  if (!props.keyboardNavigation) return
  if (
    !props.visible ||
    !isValidIndex(selection.value) ||
    props.options[selection.value] === undefined ||
    !props.selectOnTab
  )
    return
  e.preventDefault()
  emit('select', props.options[selection.value])
})

const onVisible = () => {
  selection.value = isValidIndex(props.autoScrollIndex)
    ? props.autoScrollIndex
    : null
  loading.value = false
}
const injectedPortalTarget = inject(PORTAL_TARGET)
const portalTarget = computed(() => {
  // Respect a more local provider (such as a scrolling Settings pane), while
  // keeping nested popups inside their nearest dismissable/focus layer.
  const providedTarget = getElement(injectedPortalTarget)
  const parentContent = getElement(reference.value)?.closest(
    '[data-scope="popover"][data-part="content"], [data-scope="dialog"][data-part="content"]',
  )
  if (
    providedTarget &&
    (!parentContent || parentContent.contains(providedTarget))
  )
    return providedTarget
  return parentContent || providedTarget || 'body'
})
provide(
  PORTAL_TARGET,
  computed(() => contentHost.value || getElement(injectedPortalTarget)),
)

useViewportShield(() => props.visible, shieldElement, portalTarget, shieldOffset)

function onOutside(
  name: 'focusOutside' | 'interactOutside' | 'pointerDownOutside',
  event: CustomEvent,
) {
  // Zag observes outside pointerdown at document capture time. Do not dismiss
  // until click: the same shield must own both halves of the pointer gesture.
  const target = event.detail?.originalEvent?.target
  if (
    target === shieldElement.value ||
    (target instanceof Node && getElement(reference.value)?.contains(target))
  ) {
    event.preventDefault()
    return
  }
  emit(name, event)
}
function onShieldClick(event: MouseEvent) {
  // Preserve the existing controlled-visible/outside-event API, but defer its
  // dismissal request until the consuming click instead of pointerdown.
  emit(
    'interactOutside',
    new CustomEvent('interact.outside', {
      detail: { originalEvent: event },
      cancelable: true,
    }),
  )
}
</script>
