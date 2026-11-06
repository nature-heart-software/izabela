<template>
  <div
    ref="root"
    :data-async-region="mode"
    :class="[
      grid({ gap: 'inherit', minWidth: 0 }),
      normalizeClass(attrs.class),
    ]"
    :style="[
      normalizeStyle(attrs.style),
      (pending || failed) && mode === 'panel' && readyHeight
        ? { minHeight: `${readyHeight}px` }
        : {},
    ]"
    :aria-busy="pending"
  >
    <div
      v-if="failed"
      role="alert"
      :class="grid({ gap: 'inherit', minWidth: 0 })"
    >
      <NvText v-if="mode === 'panel'">Unable to load this section.</NvText>
      <NvButton :size="controlSize()" aria-label="Retry loading" @click="retry"
        >Retry</NvButton
      >
    </div>
    <template v-else>
      <template v-if="pending">
        <NvSelect
          v-if="mode === 'control'"
          v-bind="loadingAttrs()"
          :disabled="true"
          placeholder="Loading…"
        />
        <NvText v-else role="status">Loading…</NvText>
      </template>
      <div
        :class="
          pending ? box({ display: 'none' }) : box({ display: 'contents' })
        "
      >
        <ErrorScope :key="attempt" :forwarded-attrs="childAttrs()" />
      </div>
    </template>
  </div>
</template>
<script setup lang="ts">
import {
  defineComponent,
  h,
  nextTick,
  normalizeClass,
  normalizeStyle,
  onBeforeUnmount,
  onErrorCaptured,
  onMounted,
  ref,
  useAttrs,
  watch,
  type Component as VueComponent,
  type PropType,
} from 'vue'
import { NvButton, NvSelect, NvText } from '@packages/ui'
import { box, grid } from '@/styled-system/patterns'

defineOptions({ inheritAttrs: false })
const props = withDefaults(
  defineProps<{
    component: VueComponent
    mode?: 'control' | 'panel'
    componentKey?: string | number
  }>(),
  { mode: 'panel' },
)
const attrs = useAttrs()
const pending = ref(true)
const failed = ref(false)
const attempt = ref(0)
const root = ref<HTMLElement>()
const readyHeight = ref(0)
let observer: ResizeObserver | undefined
let alive = true
const ErrorScope = defineComponent({
  name: 'AsyncRegionErrorScope',
  props: {
    forwardedAttrs: {
      type: Object as PropType<Record<string, unknown>>,
      required: true,
    },
  },
  setup(scopeProps) {
    const currentAttempt = attempt.value
    const selectedComponent = props.component
    const selectedKey = props.componentKey
    onErrorCaptured(() => {
      if (alive && currentAttempt === attempt.value) {
        failed.value = true
        pending.value = false
      }
      return false
    })
    // Vue forwards an async component's public ref only after its inner
    // component resolves. Keep portals outside a pending Suspense: in the
    // pinned runtime, attribute updates can precede deferred Teleport mounting.
    const onReady = (instance: unknown) => {
      if (instance) resolved(currentAttempt)
    }
    return () =>
      h(selectedComponent, {
        ...scopeProps.forwardedAttrs,
        key: selectedKey,
        ref: onReady,
      })
  },
})
function measureReady() {
  if (!alive || pending.value || failed.value || !root.value) return
  const height = root.value.getBoundingClientRect().height
  if (Number.isFinite(height) && height >= 0) readyHeight.value = height
}
function resolved(currentAttempt: number) {
  if (
    !alive ||
    failed.value ||
    !pending.value ||
    currentAttempt !== attempt.value
  )
    return
  // Complete deferred portal mounts before removing the placeholder. This
  // also coalesces repeated ref callbacks without introducing a paint delay.
  void nextTick(() => {
    if (
      !alive ||
      failed.value ||
      !pending.value ||
      currentAttempt !== attempt.value
    )
      return
    pending.value = false
    void nextTick(measureReady)
  })
}
watch(
  () => [props.component, props.componentKey],
  () => {
    measureReady()
    attempt.value++
    failed.value = false
    pending.value = true
  },
)
function retry() {
  attempt.value++
  failed.value = false
  pending.value = true
}
function controlSize() {
  const size = attrs.size
  return size === 'xs' || size === 'sm' || size === 'lg' ? size : 'md'
}
onMounted(() => {
  if (typeof ResizeObserver !== 'undefined') {
    observer = new ResizeObserver(measureReady)
    if (root.value) observer.observe(root.value)
  }
  measureReady()
})
onBeforeUnmount(() => {
  alive = false
  observer?.disconnect()
})
function childAttrs() {
  return Object.fromEntries(
    Object.entries(attrs).filter(
      ([name]) => name !== 'class' && name !== 'style',
    ),
  )
}
function loadingAttrs() {
  // The placeholder must not retain a selected value or invoke provider handlers.
  return Object.fromEntries(
    Object.entries(childAttrs()).filter(
      ([name]) =>
        !name.startsWith('on') &&
        ![
          'modelValue',
          'model-value',
          'value',
          'defaultValue',
          'default-value',
        ].includes(name),
    ),
  )
}
</script>
