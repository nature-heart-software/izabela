<template>
  <StSelectOption ref="el" v-bind="props">
    <div class="option__content">
      <slot />
    </div>
    <div class="option__after">
      <slot :hover="isHover" name="after" />
    </div>
  </StSelectOption>
</template>
<script lang="ts" setup>
import { defineProps, ref } from 'vue'
import { StSelectOption } from './select.styled'
import { optionProps as propsDefinition } from './select.shared'
import { useElementHover } from '@vueuse/core'

const props = defineProps(propsDefinition)

const el = ref(null)
const isHover = useElementHover(el)
</script>
