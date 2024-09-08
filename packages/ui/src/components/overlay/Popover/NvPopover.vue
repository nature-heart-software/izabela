<template>
  <Popover.Root
    v-model:open="open"
    :autoFocus="false"
    :positioning="{
      placement: 'bottom-start',
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
      <Teleport to="body">
        <Popover.Positioner>
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
import { defineProps, ref } from 'vue'
import { StPopover } from './popover.styled'
import { props as propsDefinition } from './popover.shared'
import { tokens } from '@/styles/tokens'
import { Popover } from '@ark-ui/vue'
import Card from '@/components/display/Card/NvCard.vue'
import { rem } from 'polished'

const open = ref(false)
const props = defineProps(propsDefinition)
</script>
