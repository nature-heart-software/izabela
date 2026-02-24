<template>
  <Popover.Root
    v-model:open="open"
    :autoFocus="false"
    :positioning="{
      placement: props.placement,
      flip: true,
      overflowPadding: tokens.spacing['3'],
      offset: {
        mainAxis: tokens.spacing['4'],
      },
    }"
    asChild
    portalled
  >
    <StPopover v-bind="props">
      <Popover.Trigger asChild>
        <slot name="reference" />
      </Popover.Trigger>
      <Teleport :to="portalTarget" defer>
        <div
          v-show="open"
          class="fixed inset-0 pointer-events-auto"
          :style="{ zIndex: 9999 }"
          @click.stop.prevent
          @mouseup.stop.prevent
          @mousedown.stop.prevent
        />
        <Popover.Positioner :style="{ zIndex: 9999 }">
          <Popover.Content :hidden="false">
            <Transition>
              <Card
                v-if="open"
                :size="props.size"
                :style="{ maxWidth: rem(300) }"
              >
                <slot />
              </Card>
            </Transition>
          </Popover.Content>
        </Popover.Positioner>
      </Teleport>
    </StPopover>
  </Popover.Root>
</template>
<script lang="ts" setup>
import { computed, defineProps, inject, ref } from 'vue'
import { StPopover } from './popover.styled'
import { props as propsDefinition } from './popover.shared'
import { tokens } from '@/styles/tokens'
import { Popover } from '@ark-ui/vue'
import Card from '@/components/display/Card/NvCard.vue'
import { rem } from 'polished'
import { getElement } from '@/utils/vue'
import { PORTAL_TARGET } from '@/consts'

const open = ref(false)
const props = defineProps(propsDefinition)
const injectedPortalTarget = inject(PORTAL_TARGET)
const portalTarget = computed(() => getElement(injectedPortalTarget) || 'body')
</script>
