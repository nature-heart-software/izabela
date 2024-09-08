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
      @open-change="(details) => emit('openChange', details)"
      @escape-key-down="(details) => emit('escapeKeyDown', details)"
      @focus-outside="(details) => emit('focusOutside', details)"
      @interact-outside="(details) => emit('interactOutside', details)"
      @pointer-down-outside="(details) => emit('pointerDownOutside', details)"
    >
      <Popover.Trigger
        ref="reference"
        asChild
        class="inline-flex w-full"
        @blur.prevent
      >
        <slot name="reference" />
      </Popover.Trigger>
      <Teleport to="body">
        <Popover.Positioner ref="positioner" :style="{ zIndex: 9999 }">
          <Popover.Content :hidden="false" asChild>
            <div
              @click.stop.prevent
              @mouseup.stop.prevent
              @mousedown.prevent.stop
            >
              <Transition>
                <StAutocomplete
                  v-if="props.visible"
                  class="autocomplete"
                  v-bind="{ ...props, width: autocompleteWidth }"
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
                        getItemKey: (index) =>
                          get(
                            props.options[index],
                            props.valueKey,
                            props.options[index],
                          ),
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
import { computed, defineProps, ref, watch } from 'vue'
import { StAutocomplete } from './autocomplete.styled'
import { defaultWidth, props as propsDefinition } from './autocomplete.shared'
import { tokens } from '@/styles/tokens'
import { onKeyStroke, useElementSize } from '@vueuse/core'
import { ElLoadingDirective } from 'element-plus'
import NvVirtualList from '@/components/miscellaneous/VirtualList/NvVirtualList.vue'
import NvVirtualListContainer from '@/components/miscellaneous/VirtualList/NvVirtualListContainer.vue'
import get from 'lodash/get'
import { Virtualizer } from '@tanstack/virtual-core'

const props = defineProps(propsDefinition)
const list = ref<
  undefined | { scrollToIndex: Virtualizer<Element, Element>['scrollToIndex'] }
>()
const reference = ref()
const autocomplete = ref()
const selection = ref<number | null | undefined>(null)

const { width } = useElementSize(reference)
const vLoading = ElLoadingDirective
const loading = ref(true)
const positioner = ref()
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
    selection.value = 0
  },
)

watch(selection, (selection) => {
  if (typeof selection === 'number') {
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

onKeyStroke('ArrowDown', (e) => {
  if (!props.visible) return
  e.preventDefault()
  if (typeof selection.value !== 'number') {
    selection.value = props.autoScrollIndex || 0
    return
  }
  if (selection.value === props.options.length - 1) {
    selection.value = 0
  } else {
    selection.value += 1
  }
})

onKeyStroke('ArrowUp', (e) => {
  if (!props.visible) return
  e.preventDefault()
  if (typeof selection.value !== 'number') {
    selection.value = props.autoScrollIndex || 0
    return
  }
  if (selection.value === 0) {
    selection.value = props.options.length - 1
  } else {
    selection.value -= 1
  }
})

onKeyStroke('Enter', (e) => {
  if (!props.visible || typeof selection.value !== 'number') return
  e.preventDefault()
  emit('select', props.options[selection.value])
})

onKeyStroke('Tab', (e) => {
  if (
    !props.visible ||
    typeof selection.value !== 'number' ||
    !props.selectOnTab
  )
    return
  e.preventDefault()
  emit('select', props.options[selection.value])
})

const onVisible = () => {
  selection.value = props.autoScrollIndex
  loading.value = false
}
</script>
