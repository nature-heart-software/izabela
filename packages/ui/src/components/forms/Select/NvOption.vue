<template>
  <StSelectOption v-bind="props">
    <div class="option__content">
      <slot />
    </div>
    <div class="option__after">
      <slot name="after" />
    </div>
  </StSelectOption>
</template>
<script lang="ts" setup>
import { defineProps } from 'vue'
import { StSelectOption } from './select.styled'
import { optionProps as propsDefinition } from './select.shared'

const props = defineProps(propsDefinition)
</script>
