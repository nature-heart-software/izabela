<template>
  <StContextMenu v-bind="props">
    <tippy ref="tippyRef" v-bind="tippyProps">
      <slot name="reference" />
      <template #content>
        <div @click="close()">
          <slot />
        </div>
      </template>
    </tippy>
  </StContextMenu>
</template>
<script lang="ts" setup>
import { defineProps, ref } from 'vue'
import { StContextMenu } from './context-menu.styled'
import { props as propsDefinition } from './context-menu.shared'
import { Tippy } from 'vue-tippy'
import tokens from '@/styles/tokens'

const props = defineProps(propsDefinition)
const tippyProps: typeof props['tippyOptions'] = {
  trigger: 'click',
  interactive: true,
  placement: 'bottom-end',
  offset: [0, tokens.spacing['4']],
  theme: `context-menu`,
  maxWidth: 300,
  ...props.tippyOptions,
}
const tippyRef = ref()
const close = () => {
  tippyRef.value?.hide()
}
</script>
