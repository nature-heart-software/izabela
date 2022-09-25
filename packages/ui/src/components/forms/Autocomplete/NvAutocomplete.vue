<template>
  <div class="inline-flex">
    <span ref="reference" class="inline-flex w-full">
      <slot name="reference" />
    </span>
    <div ref="autocomplete" :style="{ zIndex: 9999 }" class="absolute">
      <Transition>
        <StAutocomplete
          v-if="props.visible"
          v-loading="loading"
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
  </div>
</template>
<script lang="ts" setup>
import {
  computed,
  defineProps,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  watch,
} from 'vue'
import { StAutocomplete } from './autocomplete.styled'
import { defaultWidth, props as propsDefinition } from './autocomplete.shared'
import {
  autoUpdate,
  computePosition,
  flip,
  offset,
  shift,
} from '@floating-ui/dom'
import { rem } from 'polished'
import tokens from '@/styles/tokens'
import { onKeyStroke, useElementSize } from '@vueuse/core'
import { ElLoadingDirective } from 'element-plus'
import NvVirtualList from '@/components/miscellaneous/VirtualList/NvVirtualList.vue'
import NvVirtualListContainer from '@/components/miscellaneous/VirtualList/NvVirtualListContainer.vue'
import { Virtualizer } from '@tanstack/virtual-core'
import { get } from 'lodash'

const props = defineProps(propsDefinition)
const list = ref<undefined | { scrollToIndex: Virtualizer['scrollToIndex'] }>()
const reference = ref()
const autocomplete = ref()
const selection = ref<number | null | undefined>(null)
const floatingCleanup = shallowRef()
const { width } = useElementSize(reference)
const vLoading = ElLoadingDirective
const loading = ref(true)
const emit = defineEmits(['select'])

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

const updateFloating = () => {
  computePosition(reference.value, autocomplete.value, {
    placement: props.placement,
    middleware: [
      offset(tokens.spacing['4']),
      flip(),
      shift({
        padding: tokens.spacing['3'],
      }),
    ],
  }).then(({ x, y }) => {
    Object.assign(autocomplete.value.style, {
      left: rem(x),
      top: rem(y),
    })
  })
}

onMounted(() => {
  floatingCleanup.value = autoUpdate(
    reference.value,
    autocomplete.value,
    updateFloating,
  )
})

onBeforeUnmount(() => {
  floatingCleanup.value?.()
})
</script>
