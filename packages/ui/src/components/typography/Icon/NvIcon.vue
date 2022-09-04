<template>
  <component
    :is="component"
    :height="sizeValue"
    :width="sizeValue"
    fill="currentColor"
  />
</template>
<script lang="ts" setup>
import { computed, defineProps } from 'vue'
import tokens from '@/styles/tokens'
import { props as propsDefinition } from './icon.shared'
import * as Icons from '@packages/icons'

const props = defineProps(propsDefinition)
const sizeValue = computed(() => tokens.fontSize[props.size][0])
const component = computed(() =>
  Object.values(Icons as any).find((i: any) =>
    [props.name, `nv-${props.name}`].includes(i.name),
  ),
)
</script>
<style lang="scss">
body {
  @apply font-sans text-gray-80 text-2;
}
</style>
