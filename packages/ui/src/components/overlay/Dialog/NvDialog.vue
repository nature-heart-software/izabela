<template>
  <Dialog.Root
    v-bind="$attrs"
    v-model:open="dialogOpen"
    :ids="{ trigger: triggerId }"
  >
    <ReferenceTrigger>
      <slot name="reference" />
    </ReferenceTrigger>
    <Teleport :to="props.portalTarget" defer>
      <PortalTargetProvider :target="portalTarget">
        <Transition class="transition">
          <StDialogBackdrop v-if="dialogOpen" />
        </Transition>
        <Transition class="transition">
          <StDialogPositioner v-if="dialogOpen">
            <StDialogContentWrapper
              ref="portalTarget"
              @mousedown.self="closeDialog"
            >
              <StDialogContent>
                <NvCard>
                  <NvStack :spacing="5">
                    <NvGroup justify="apart">
                      <StDialogTitle asChild>
                        <NvText type="title">
                          <slot name="title" />
                        </NvText>
                      </StDialogTitle>
                      <StDialogCloseTrigger as-child>
                        <NvButton
                          icon-name="times"
                          size="xs"
                          squared
                          type="plain"
                        />
                      </StDialogCloseTrigger>
                    </NvGroup>
                    <StDialogDescription v-if="$slots.description">
                      <NvText>
                        <slot name="description" />
                      </NvText>
                    </StDialogDescription>
                    <slot name="footer" />
                  </NvStack>
                </NvCard>
              </StDialogContent>
            </StDialogContentWrapper>
          </StDialogPositioner>
        </Transition>
      </PortalTargetProvider>
    </Teleport>
  </Dialog.Root>
</template>
<script lang="ts" setup>
import {
  Comment,
  Fragment,
  Text,
  computed,
  defineComponent,
  h,
  onUpdated,
  provide,
  ref,
  useId,
  watchPostEffect,
  type VNode,
} from 'vue'
import { getElement } from '@/utils/vue'
import { Dialog } from '@ark-ui/vue'
import { props as propsDefinition } from './dialog.shared'
import NvCard from '@/components/display/Card/NvCard.vue'
import NvButton from '@/components/forms/Button/NvButton.vue'
import NvGroup from '@/components/miscellaneous/Group/NvGroup.vue'
import NvStack from '@/components/miscellaneous/Stack/NvStack.vue'
import NvText from '@/components/typography/Text/NvText.vue'
import {
  StDialogBackdrop,
  StDialogCloseTrigger,
  StDialogContent,
  StDialogContentWrapper,
  StDialogDescription,
  StDialogPositioner,
  StDialogTitle,
  StDialogTrigger,
} from './dialog.panda'
import { PORTAL_TARGET } from '@/consts'

const PortalTargetProvider = defineComponent({
  name: 'PortalTargetProvider',
  props: {
    target: {
      type: Object,
      required: false,
    },
  },
  setup(props, { slots }) {
    // Both the Panda adapter and Ark expose a component ref before the native node.
    // Resolve reactively because the provider is mounted before dialog content.
    provide(
      PORTAL_TARGET,
      computed(() => getElement(props.target?.$el) || getElement(props.target)),
    )
    return () => slots.default?.()
  },
})

defineOptions({ inheritAttrs: false })

const portalTarget = ref()
const triggerId = ref(`nv-dialog-${useId()}-trigger`)

function referenceNodes(nodes: VNode[]): VNode[] {
  return nodes.flatMap((node) => {
    if (node.type === Fragment) return referenceNodes(node.children as VNode[])
    if (
      node.type === Comment ||
      (node.type === Text && !String(node.children).trim())
    )
      return []
    return [node]
  })
}

const ReferenceTrigger = defineComponent({
  setup(_, { slots }) {
    const trigger = ref()
    const needsButtonSemantics = ref(false)
    const disabled = ref(false)
    const syncTrigger = () => {
      const element =
        getElement(trigger.value?.$el) || getElement(trigger.value)
      if (element?.id) triggerId.value = element.id
      needsButtonSemantics.value =
        !!element &&
        !element.matches('button, input, select, textarea, a[href], summary')
      disabled.value =
        !!element &&
        (element.hasAttribute('disabled') ||
          element.getAttribute('aria-disabled') === 'true')
    }
    watchPostEffect(syncTrigger)
    onUpdated(syncTrigger)
    const onKeydown = (event: KeyboardEvent) => {
      if (
        !needsButtonSemantics.value ||
        disabled.value ||
        event.defaultPrevented
      )
        return
      // Non-native references translate button activation into Ark's click path.
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault()
        if (event.key === 'Enter' && !event.repeat)
          (event.currentTarget as HTMLElement).click()
      }
    }
    const onKeyup = (event: KeyboardEvent) => {
      if (
        needsButtonSemantics.value &&
        !disabled.value &&
        !event.defaultPrevented &&
        event.key === ' '
      ) {
        event.preventDefault()
        ;(event.currentTarget as HTMLElement).click()
      }
    }
    return () => {
      const nodes = referenceNodes(slots.default?.() || [])
      const asChild = nodes.length === 1 && nodes[0].type !== Text
      return h(
        StDialogTrigger,
        {
          ref: trigger,
          id: triggerId.value,
          asChild,
          key: String(asChild),
          role: needsButtonSemantics.value ? 'button' : undefined,
          tabindex: needsButtonSemantics.value
            ? disabled.value
              ? -1
              : 0
            : undefined,
          onKeydown,
          onKeyup,
          onClickCapture: (event: MouseEvent) => {
            if (disabled.value) event.preventDefault()
          },
        },
        { default: () => nodes },
      )
    }
  },
})

const props = defineProps({
  ...propsDefinition,
  open: {
    type: Boolean,
    default: undefined,
  },
})

const emit = defineEmits(['update:open'])

const localOpen = ref(false)

const dialogOpen = computed({
  get: () => (props.open !== undefined ? props.open : localOpen.value),
  set: (value) => {
    props.open !== undefined
      ? emit('update:open', value)
      : (localOpen.value = value)
  },
})

const closeDialog = (event: MouseEvent) => {
  if (event.target === event.currentTarget) {
    dialogOpen.value = false
  }
}
</script>
