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
import { useElementSize } from '@vueuse/core'
import { ElLoadingDirective } from 'element-plus'

const props = defineProps(propsDefinition)
const scroller = ref()
const reference = ref()
const autocomplete = ref()
const visibleItems = ref<[number, number]>([-1, -1])
const selection = ref(-1)
const floatingCleanup = shallowRef()
const { width } = useElementSize(reference)
const vLoading = ElLoadingDirective
const loading = ref(true)

watch(
  () => props.visible,
  (visible) => {
    if (!visible) loading.value = true
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
