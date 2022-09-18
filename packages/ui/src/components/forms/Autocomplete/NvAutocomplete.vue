<template>
  <div class="inline-flex">
    <span ref="reference" class="inline-flex"><slot name="reference" /></span>
    <div ref="autocomplete" class="absolute">
      <Transition>
        <StAutocomplete
          v-if="props.visible"
          v-loading="loading"
          v-bind="{ ...props, width: autocompleteWidth }"
        >
          <DynamicScroller
            ref="scroller"
            :emitUpdate="true"
            :items="props.data"
            :keyField="props.valueKey"
            :min-item-size="props.minItemSize"
            class="autocomplete__scroller"
            @update="(start, end) => (visibleItems = [start, end])"
            @visible="onVisible"
          >
            <template v-slot="{ item, index, active }">
              <DynamicScrollerItem
                :active="active"
                :data-index="index"
                :item="item"
              >
                <slot
                  v-bind="{
                    item,
                    index,
                    visible: active,
                    active: selection === index,
                  }"
                />
              </DynamicScrollerItem>
            </template>
          </DynamicScroller>
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
import { DynamicScroller, DynamicScrollerItem } from 'vue-virtual-scroller'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'
import { StAutocomplete } from './autocomplete.styled'
import { props as propsDefinition } from './autocomplete.shared'
import { get } from 'lodash'
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

const props = defineProps(propsDefinition)
const scroller = ref()
const reference = ref()
const autocomplete = ref()
const visibleItems = ref<[number, number]>([-1, -1])
const selection = ref<number | null>(null)
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
  () => props.data,
  () => {
    scroller.value.scrollToItem(0)
  },
)

watch(selection, (selection) => {
  if (typeof selection === 'number') {
    const el: any = document.querySelector(`[data-index="${selection}"]`)
    if (el) {
      el?.scrollIntoViewIfNeeded(false)
    } else {
      scroller.value.scrollToItem(selection)
    }
  }
})

const autocompleteWidth = computed(() => {
  if (props.width) return props.width
  if (width.value < 300) return 300
  return width.value
})

onKeyStroke('ArrowDown', (e) => {
  if (!props.visible) return
  e.preventDefault()
  if (selection.value === null) {
    selection.value = visibleItems.value[0]
    return
  }
  if (selection.value === props.data.length - 1) {
    selection.value = 0
  } else {
    selection.value += 1
  }
})

onKeyStroke('ArrowUp', (e) => {
  if (!props.visible) return
  e.preventDefault()
  if (selection.value === null) {
    selection.value = visibleItems.value[0]
    return
  }
  if (selection.value === 0) {
    selection.value = props.data.length - 1
  } else {
    selection.value -= 1
  }
})

onKeyStroke('Enter', (e) => {
  if (!props.visible || typeof selection.value !== 'number') return
  e.preventDefault()
  emit('select', props.data[selection.value])
})

const onVisible = () => {
  if (props.autoScrollValue) {
    const index = props.data.findIndex(
      (item) => get(item, props.valueKey, item) === props.autoScrollValue,
    )
    if (index > -1) {
      scroller.value.scrollToItem(index)
    }
  }
  loading.value = false
}

const updateFloating = () => {
  computePosition(reference.value, autocomplete.value, {
    placement: props.placement,
    middleware: [
      offset(tokens.spacing[2]),
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
