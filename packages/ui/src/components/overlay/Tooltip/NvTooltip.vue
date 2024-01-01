<template>
  <StTooltip ref="tooltip" v-bind="props">
    <tippy ref="tippyInstance" v-bind="tippyProps">
      <slot name="reference"/>
      <template #content>
        <slot/>
      </template>
    </tippy>
  </StTooltip>
</template>
<script lang="ts" setup>
import { defineProps, ref, watch } from 'vue'
import { StTooltip } from './tooltip.styled'
import { props as propsDefinition } from './tooltip.shared'
import { Tippy, TippyInstance, TippyOptions } from 'vue-tippy'
import tokens from '@/styles/tokens'
import { MaybeElement, useFocusWithin } from '@vueuse/core'

const props = defineProps(propsDefinition)
const tippyProps: TippyOptions = {
  trigger: 'mouseenter focus',
  delay: [250, 0],
  interactive: false,
  placement: 'top',
  offset: [0, tokens.spacing['4']],
  appendTo: () => document.body,
  theme: `tooltip`,
  maxWidth: 300,
  ...props.tippyOptions,
} as TippyOptions
const tooltip = ref<MaybeElement>()
const tippyInstance = ref<TippyInstance>()
const { focused } = useFocusWithin(tooltip)
watch(focused, (value) => {
  const instance = tippyInstance.value
  if (value) {
    if (instance && 'disable' in instance) instance.disable()
  } else {
    if (instance && 'enable' in instance) instance.enable()
  }
})
</script>
