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
            :items="props.data"
            :keyField="props.valueKey"
            :min-item-size="props.minItemSize"
            class="autocomplete__scroller"
            @visible="onVisible"
            @wheel="selection = null"
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
  if (typeof selection.value !== 'number') {
    selection.value = props.autoScrollIndex || 0
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
  if (typeof selection.value !== 'number') {
    selection.value = props.autoScrollIndex || 0
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
