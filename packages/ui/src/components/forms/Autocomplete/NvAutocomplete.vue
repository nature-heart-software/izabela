<template>
  <div>
    <Popover.Root
      :autoFocus="false"
      :open="props.visible"
      :portalled="true"
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
      <Popover.Anchor
        ref="reference"
        :class="box({ display: 'inline-flex', width: '100%' })"
        @blur.prevent
      >
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
import { StAutocomplete, shield, positionerStyle } from './autocomplete.panda'
import { box } from '@/styled-system/patterns'
import { defaultWidth, props as propsDefinition } from './autocomplete.shared'
import { tokens } from '@/styles/tokens'
import { onKeyStroke, useElementSize } from '@vueuse/core'
import NvVirtualList from '@/components/miscellaneous/VirtualList/NvVirtualList.vue'
import NvVirtualListContainer from '@/components/miscellaneous/VirtualList/NvVirtualListContainer.vue'
import get from 'lodash/get'
import { Virtualizer } from '@tanstack/virtual-core'
import { getElement } from '@/utils/vue'
import { PORTAL_TARGET } from '@/consts'

const props = defineProps(propsDefinition)
defineSlots<{
  reference(): unknown
  fallback(): unknown
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
  // A child's physical host must be inside the nearest containing popup, not
  // merely its dialog sibling. This also supports legacy portal providers.
  const parentContent = getElement(reference.value)?.closest(
    '[data-scope="popover"][data-part="content"], [data-scope="dialog"][data-part="content"]',
  )
  return parentContent || getElement(injectedPortalTarget) || 'body'
})
provide(
  PORTAL_TARGET,
  computed(() => contentHost.value || getElement(injectedPortalTarget)),
)

watch(
  [() => props.visible, shieldElement, portalTarget],
  ([visible, element], _, onCleanup) => {
    if (!visible || !element) return
    const update = () => {
      // A containing Ark positioner's transform establishes a fixed containing
      // block. Cancel that displacement while keeping the shield physically
      // inside the parent popup for nested dismissable/focus-layer ownership.
      const rect = element.getBoundingClientRect()
      const { x, y } = shieldOffset.value
      if (rect.left !== 0 || rect.top !== 0) {
        shieldOffset.value = { x: x - rect.left, y: y - rect.top }
      }
    }
    const observer = new MutationObserver(update)
    for (
      let parent = element.parentElement;
      parent;
      parent = parent.parentElement
    ) {
      observer.observe(parent, {
        attributes: true,
        attributeFilter: ['style', 'class'],
      })
    }
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    update()
    onCleanup(() => {
      observer.disconnect()
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    })
  },
  { flush: 'post' },
)

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
