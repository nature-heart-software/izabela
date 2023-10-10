<template>
  <StTooltip v-bind="props">
    <tippy v-bind="tippyProps">
      <slot name="reference"/>
      <template #content>
        <slot/>
      </template>
    </tippy>
  </StTooltip>
</template>
<script lang="ts" setup>
import { defineProps } from 'vue'
import { StTooltip } from './tooltip.styled'
import { props as propsDefinition } from './tooltip.shared'
import { Tippy } from 'vue-tippy'
import tokens from '@/styles/tokens'

const props = defineProps(propsDefinition)
const tippyProps: typeof props['tippyOptions'] = {
  trigger: 'mouseenter focus',
  delay: [250, 0],
  interactive: false,
  placement: 'top',
  offset: [0, tokens.spacing['4']],
  appendTo: () => document.body,
  theme: `tooltip`,
  maxWidth: 300,
  ...props.tippyOptions,
}
</script>
