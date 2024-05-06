<template>
  <StPopover v-bind="props">
    <tippy v-bind="tippyProps">
      <slot name="reference"/>
      <template #content>
        <slot/>
      </template>
    </tippy>
  </StPopover>
</template>
<script lang="ts" setup>
import { defineProps } from 'vue'
import { StPopover } from './popover.styled'
import { props as propsDefinition } from './popover.shared'
import { Tippy } from 'vue-tippy'
import { tokens } from '@/styles/tokens'

const props = defineProps(propsDefinition)
const tippyProps: typeof props['tippyOptions'] = {
  trigger: 'click',
  interactive: true,
  placement: 'bottom-start',
  offset: [0, tokens.spacing['4']],
  appendTo: () => document.body,
  theme: `popover-${ props.size }`,
  maxWidth: 300,
  ...props.tippyOptions,
}
</script>
