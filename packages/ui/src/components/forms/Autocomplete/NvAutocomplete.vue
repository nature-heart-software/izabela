<template>
  <span class="inline-flex">
    <span ref="reference" class="inline-flex"><slot name="reference" /></span>
    <StAutocomplete
      v-show="props.visible"
      ref="autocomplete"
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
  </span>
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
import { useElementSize } from '@vueuse/core'

const props = defineProps(propsDefinition)
const scroller = ref()
const reference = ref()
const autocomplete = ref()
const visibleItems = ref<[number, number]>([-1, -1])
const selection = ref(-1)
const floatingCleanup = shallowRef()
const { width } = useElementSize(reference)
watch(
  () => props.visible,
  () => {
    selection.value = -1
  },
)
watch(
  () => props.data,
  () => {
    scroller.value.scrollToItem(0)
  },
)
const autocompleteWidth = computed(() => {
  if (props.width) return props.width
  if (width.value < 300) return 300
  return width.value
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
}

const updateFloating = () => {
  computePosition(reference.value, autocomplete.value.$el, {
    placement: props.placement,
    middleware: [
      offset(tokens.spacing[2]),
      flip(),
      shift({
        padding: tokens.spacing['3'],
      }),
    ],
  }).then(({ x, y }) => {
    Object.assign(autocomplete.value.$el.style, {
      left: rem(x),
      top: rem(y),
    })
  })
}

onMounted(() => {
  floatingCleanup.value = autoUpdate(
    reference.value,
    autocomplete.value.$el,
    updateFloating,
  )
})

onBeforeUnmount(() => {
  floatingCleanup.value?.()
})
</script>
